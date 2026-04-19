import prisma from "../db.server.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getQuery(request) {
  const url = new URL(request.url);
  return {
    url,
    shop: String(url.searchParams.get("shop") || ""),
    customerId: String(url.searchParams.get("customerId") || ""),
    productId: String(url.searchParams.get("productId") || ""),
    variantId: String(url.searchParams.get("variantId") || ""),
  };
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";

  try {
    if (ct.includes("application/json")) {
      return await request.json();
    }

    if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const fd = await request.formData();
      return Object.fromEntries(fd.entries());
    }

    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  } catch (e) {
    console.error("PROXY readBody error:", e);
    return {};
  }
}

async function ensureSetting(shop) {
  return prisma.wishlistSetting.upsert({
    where: { shop },
    update: {},
    create: { shop, enabled: true },
  });
}

async function doToggle({ shop, customerId, productId, variantId }) {
  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);
  if (!customerId) return json({ ok: false, error: "Missing customerId" }, 400);
  if (!variantId) return json({ ok: false, error: "Missing variantId" }, 400);

  try {
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        shop,
        customerId,
        variantId,
      },
    });

    if (existing) {
      await prisma.wishlistItem.deleteMany({
        where: {
          shop,
          customerId,
          variantId,
        },
      });

      return json({
        ok: true,
        active: false,
        wishlisted: false,
        action: "removed",
      });
    }

    await prisma.wishlistItem.create({
      data: {
        shop,
        customerId,
        productId: String(productId || ""),
        variantId,
      },
    });

    return json({
      ok: true,
      active: true,
      wishlisted: true,
      action: "added",
    });
  } catch (e) {
    console.error("PROXY TOGGLE ERROR:", e);
    return json({ ok: false, error: e?.message || "Toggle failed" }, 500);
  }
}

export async function loader({ request, params }) {
  try {
    const action = params.action;
    const { shop, customerId, productId, variantId } = getQuery(request);

    if (!action) {
      return json({ ok: false, error: "Missing action" }, 400);
    }

    if (!shop) {
      return json({ ok: false, error: "Missing shop" }, 400);
    }

    const setting = await ensureSetting(shop);

    if (action === "status") {
      if (!setting.enabled) {
        return json({
          ok: true,
          enabled: false,
          active: false,
        });
      }

      return json({
        ok: true,
        enabled: true,
        active: true,
      });
    }

    if (action === "list") {
      if (!setting.enabled) {
        return json({ ok: true, items: [] });
      }

      if (!customerId) {
        return json({ ok: true, items: [] });
      }

      const items = await prisma.wishlistItem.findMany({
        where: {
          shop,
          customerId,
        },
        orderBy: { createdAt: "desc" },
      });

      return json({ ok: true, items });
    }

    if (action === "toggle") {
      if (!setting.enabled) {
        return json({ ok: false, error: "Wishlist disabled" }, 403);
      }

      return await doToggle({ shop, customerId, productId, variantId });
    }

    return json({ ok: false, error: "Unknown action" }, 404);
  } catch (e) {
    console.error("PROXY LOADER ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

export async function action({ request, params }) {
  try {
    const action = params.action;
    const url = new URL(request.url);
    const shop = String(url.searchParams.get("shop") || "");
    const body = await readBody(request);

    if (!action) {
      return json({ ok: false, error: "Missing action" }, 400);
    }

    if (!shop) {
      return json({ ok: false, error: "Missing shop" }, 400);
    }

    const setting = await ensureSetting(shop);

    if (!setting.enabled) {
      return json({ ok: false, error: "Wishlist disabled" }, 403);
    }

    if (action === "toggle") {
      const customerId = String(body.customerId || "");
      const productId = String(body.productId || "");
      const variantId = String(body.variantId || "");

      return await doToggle({ shop, customerId, productId, variantId });
    }

    if (action === "merge") {
      const fromCustomerId = String(body.fromCustomerId || "");
      const toCustomerId = String(body.toCustomerId || "");

      if (!fromCustomerId || !toCustomerId) {
        return json({ ok: false, error: "Missing params" }, 400);
      }

      if (fromCustomerId === toCustomerId) {
        return json({ ok: true, merged: 0 }, 200);
      }

      const guestItems = await prisma.wishlistItem.findMany({
        where: {
          shop,
          customerId: fromCustomerId,
        },
      });

      let merged = 0;

      for (const item of guestItems) {
        const exists = await prisma.wishlistItem.findFirst({
          where: {
            shop,
            customerId: toCustomerId,
            variantId: item.variantId,
          },
        });

        if (!exists) {
          await prisma.wishlistItem.create({
            data: {
              shop,
              customerId: toCustomerId,
              productId: item.productId,
              variantId: item.variantId,
            },
          });
          merged++;
        }
      }

      await prisma.wishlistItem.deleteMany({
        where: {
          shop,
          customerId: fromCustomerId,
        },
      });

      return json({ ok: true, merged }, 200);
    }

    return json({ ok: false, error: "Unsupported POST action" }, 405);
  } catch (e) {
    console.error("PROXY ACTION ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}