import prisma from "../db.server.js";
import { authenticate } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    return await request.json();
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    return Object.fromEntries(fd.entries());
  }

  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

async function ensureSetting(shop) {
  return prisma.wishlistSetting.upsert({
    where: { shop },
    update: {},
    create: { shop, enabled: true },
  });
}

async function isBillingActive(admin) {
  const bypass =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  if (bypass) return true;

  return await hasActiveWishlistSubscription(admin);
}

async function doToggle({ shop, customerId, productId, variantId }) {
  if (!customerId || !variantId) {
    return json({ ok: false, error: "Missing customerId/variantId" }, 400);
  }

  const existing = await prisma.wishlistItem.findFirst({
    where: { shop, customerId, variantId },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });

    return json(
      {
        ok: true,
        active: false,
        action: "removed",
        wishlisted: false,
      },
      200
    );
  }

  await prisma.wishlistItem.create({
    data: {
      shop,
      customerId,
      productId,
      variantId,
    },
  });

  return json(
    {
      ok: true,
      active: true,
      action: "added",
      wishlisted: true,
    },
    200
  );
}

/* ===========================
   GET /apps/wishlist/:action
=========================== */
export async function loader({ request, params }) {
  try {
    const action = params.action;
    const url = new URL(request.url);

    const { admin, session } = await authenticate.public.appProxy(request);

    const shop = session?.shop || url.searchParams.get("shop") || "";
    if (!shop) {
      return json({ ok: false, error: "Missing shop" }, 400);
    }

    const setting = await ensureSetting(shop);

    if (action === "status") {
      if (!setting.enabled) {
        return json({ ok: true, enabled: false, active: false }, 200);
      }

      const active = await isBillingActive(admin);
      if (!active) {
        return json({ ok: false, error: "Billing required" }, 402);
      }

      return json({ ok: true, enabled: true, active: true }, 200);
    }

    if (action === "list") {
      if (!setting.enabled) {
        return json({ ok: true, items: [] }, 200);
      }

      const active = await isBillingActive(admin);
      if (!active) {
        return json({ ok: false, error: "Billing required" }, 402);
      }

      const customerId = String(url.searchParams.get("customerId") || "");
      if (!customerId) {
        return json({ ok: true, items: [] }, 200);
      }

      const items = await prisma.wishlistItem.findMany({
        where: { shop, customerId },
        orderBy: { createdAt: "desc" },
      });

      return json({ ok: true, items }, 200);
    }

    if (action === "toggle") {
      if (!setting.enabled) {
        return json({ ok: false, error: "Wishlist disabled" }, 403);
      }

      const active = await isBillingActive(admin);
      if (!active) {
        return json({ ok: false, error: "Billing required" }, 402);
      }

      const customerId = String(url.searchParams.get("customerId") || "");
      const productId = String(url.searchParams.get("productId") || "");
      const variantId = String(url.searchParams.get("variantId") || "");

      return await doToggle({ shop, customerId, productId, variantId });
    }

    return json({ ok: false, error: "Not found" }, 404);
  } catch (error) {
    console.error("apps.wishlist loader error:", error);
    return json({ ok: false, error: error?.message || "Server error" }, 500);
  }
}

/* ===========================
   POST /apps/wishlist/:action
=========================== */
export async function action({ request, params }) {
  try {
    const actionName = params.action;
    const url = new URL(request.url);

    const { admin, session } = await authenticate.public.appProxy(request);

    const shop = session?.shop || url.searchParams.get("shop") || "";
    if (!shop) {
      return json({ ok: false, error: "Missing shop" }, 400);
    }

    const setting = await ensureSetting(shop);
    if (!setting.enabled) {
      return json({ ok: false, error: "Wishlist disabled" }, 403);
    }

    const active = await isBillingActive(admin);
    if (!active) {
      return json({ ok: false, error: "Billing required" }, 402);
    }

    const body = await readBody(request);

    if (actionName === "toggle") {
      const customerId = String(body.customerId || "");
      const productId = String(body.productId || "");
      const variantId = String(body.variantId || "");

      return await doToggle({ shop, customerId, productId, variantId });
    }

    if (actionName === "merge") {
      const fromCustomerId = String(body.fromCustomerId || "");
      const toCustomerId = String(body.toCustomerId || "");

      if (!fromCustomerId || !toCustomerId) {
        return json({ ok: false, error: "Missing merge ids" }, 400);
      }

      if (fromCustomerId === toCustomerId) {
        return json({ ok: true, merged: 0 }, 200);
      }

      const guestItems = await prisma.wishlistItem.findMany({
        where: { shop, customerId: fromCustomerId },
      });

      let merged = 0;

      for (const it of guestItems) {
        const existed = await prisma.wishlistItem.findFirst({
          where: {
            shop,
            customerId: toCustomerId,
            variantId: it.variantId,
          },
        });

        if (!existed) {
          await prisma.wishlistItem.create({
            data: {
              shop,
              customerId: toCustomerId,
              productId: it.productId,
              variantId: it.variantId,
            },
          });
          merged++;
        }
      }

      await prisma.wishlistItem.deleteMany({
        where: { shop, customerId: fromCustomerId },
      });

      return json({ ok: true, merged }, 200);
    }

    return json({ ok: false, error: "Not found" }, 404);
  } catch (error) {
    console.error("apps.wishlist action error:", error);
    return json({ ok: false, error: error?.message || "Server error" }, 500);
  }
}