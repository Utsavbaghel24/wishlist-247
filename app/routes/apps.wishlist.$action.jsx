// app/routes/apps.wishlist.$action.jsx
import prisma from "../db.server";
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
  if (ct.includes("application/json")) return await request.json();
  const fd = await request.formData();
  return Object.fromEntries(fd.entries());
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

/* ===========================
   GET /apps/wishlist/:action
=========================== */
export async function loader({ request, params }) {
  const action = params.action;
  const url = new URL(request.url);

  // ✅ IMPORTANT: Proxy auth (storefront)
  const { admin, session } = await authenticate.public.appProxy(request);

  const shop = session?.shop || url.searchParams.get("shop") || "";
  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);

  // ✅ ON/OFF switch
  const setting = await ensureSetting(shop);

  if (action === "status") {
    // return enabled false if store turned it off
    if (!setting.enabled) return json({ ok: true, enabled: false }, 200);

    const active = await isBillingActive(admin);
    if (!active) return json({ ok: false, error: "Billing required" }, 402);

    return json({ ok: true, enabled: true }, 200);
  }

  if (action === "list") {
    if (!setting.enabled) return json({ ok: true, items: [] }, 200);

    const active = await isBillingActive(admin);
    if (!active) return json({ ok: false, error: "Billing required" }, 402);

    const customerId = url.searchParams.get("customerId") || "";
    if (!customerId) return json({ ok: true, items: [] }, 200);

    const items = await prisma.wishlistItem.findMany({
      where: { shop, customerId },
      orderBy: { createdAt: "desc" },
    });

    return json({ ok: true, items }, 200);
  }

  return json({ ok: false, error: "Not found" }, 404);
}

/* ===========================
   POST /apps/wishlist/:action
=========================== */
export async function action({ request, params }) {
  const actionName = params.action;
  const url = new URL(request.url);

  const { admin, session } = await authenticate.public.appProxy(request);

  const shop = session?.shop || url.searchParams.get("shop") || "";
  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);

  const setting = await ensureSetting(shop);
  if (!setting.enabled) return json({ ok: false, error: "Wishlist disabled" }, 403);

  const active = await isBillingActive(admin);
  if (!active) return json({ ok: false, error: "Billing required" }, 402);

  const body = await readBody(request);

  // JS sends x-www-form-urlencoded values
  const customerId = String(body.customerId || "");
  const productId = String(body.productId || "");
  const variantId = String(body.variantId || "");

  if (actionName === "toggle") {
    if (!customerId || !variantId) {
      return json({ ok: false, error: "Missing customerId/variantId" }, 400);
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { shop, customerId, variantId },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return json({ ok: true, active: false }, 200);
    }

    await prisma.wishlistItem.create({
      data: {
        shop,
        customerId,
        productId,
        variantId,
      },
    });

    return json({ ok: true, active: true }, 200);
  }

  if (actionName === "merge") {
    const fromCustomerId = String(body.fromCustomerId || "");
    const toCustomerId = String(body.toCustomerId || "");
    if (!fromCustomerId || !toCustomerId) {
      return json({ ok: false, error: "Missing merge ids" }, 400);
    }

    const guestItems = await prisma.wishlistItem.findMany({
      where: { shop, customerId: fromCustomerId },
    });

    for (const it of guestItems) {
      await prisma.wishlistItem.upsert({
        where: {
          shop_customerId_variantId: {
            shop,
            customerId: toCustomerId,
            variantId: it.variantId,
          },
        },
        update: {},
        create: {
          shop,
          customerId: toCustomerId,
          productId: it.productId,
          variantId: it.variantId,
        },
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: { shop, customerId: fromCustomerId },
    });

    return json({ ok: true }, 200);
  }

  return json({ ok: false, error: "Not found" }, 404);
}
