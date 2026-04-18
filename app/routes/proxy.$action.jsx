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
    customerId: String(url.searchParams.get("customerId") || "guest"),
    productId: String(url.searchParams.get("productId") || ""),
    variantId: String(url.searchParams.get("variantId") || ""),
  };
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    return await request.json();
  }

  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function loader({ request, params }) {
  try {
    const action = params.action;
    const { shop, customerId, productId, variantId } = getQuery(request);

    if (!action) {
      return json({ ok: false, error: "Missing action" }, 200);
    }

    if (action === "status") {
      return json({
        ok: true,
        shop,
        enabled: true,
        billingActive: true,
        billingDisabled: false,
        active: true,
      });
    }

    if (action === "list") {
      if (!shop) {
        return json({ ok: false, items: [], error: "Missing shop" }, 200);
      }

      const items = await prisma.wishlistItem.findMany({
        where: {
          shop,
          customerId,
        },
        orderBy: { createdAt: "desc" },
      });

      return json({ ok: true, items }, 200);
    }

    if (action === "toggle") {
      if (!shop) return json({ ok: false, error: "Missing shop" }, 200);
      if (!productId) return json({ ok: false, error: "Missing productId" }, 200);
      if (!variantId) return json({ ok: false, error: "Missing variantId" }, 200);

      const existing = await prisma.wishlistItem.findFirst({
        where: {
          shop,
          customerId,
          variantId,
        },
      });

      if (existing) {
        await prisma.wishlistItem.delete({
          where: { id: existing.id },
        });

        return json({
          ok: true,
          wishlisted: false,
          action: "removed",
        });
      }

      await prisma.wishlistItem.create({
        data: {
          shop,
          customerId,
          productId,
          variantId,
        },
      });

      return json({
        ok: true,
        wishlisted: true,
        action: "added",
      });
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

    if (action !== "merge") {
      return json({ ok: false, error: "Unsupported POST action" }, 405);
    }

    const url = new URL(request.url);
    const shop = String(url.searchParams.get("shop") || "");
    const body = await readBody(request);

    const fromCustomerId = String(body.fromCustomerId || "");
    const toCustomerId = String(body.toCustomerId || "");

    if (!shop || !fromCustomerId || !toCustomerId) {
      return json({ ok: false, error: "Missing params" }, 200);
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

      await prisma.wishlistItem.delete({
        where: { id: item.id },
      });
    }

    return json({ ok: true, merged }, 200);
  } catch (e) {
    console.error("PROXY ACTION ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}