import prisma from "../db.server";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function readQuery(request) {
  const url = new URL(request.url);
  return {
    shop: url.searchParams.get("shop") || "",
    customerId: url.searchParams.get("customerId") || "guest",
    productId: url.searchParams.get("productId") || "",
    variantId: url.searchParams.get("variantId") || "",
  };
}

async function handleToggle(request, source = "loader") {
  try {
    const { shop, customerId, productId, variantId } = readQuery(request);

    if (!shop) {
      return json({ ok: false, error: "Missing shop", source });
    }

    if (!productId) {
      return json({ ok: false, error: "Missing productId", source });
    }

    if (!variantId) {
      return json({ ok: false, error: "Missing variantId", source });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        shop: String(shop),
        customerId: String(customerId),
        variantId: String(variantId),
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
        source,
      });
    }

    const created = await prisma.wishlistItem.create({
      data: {
        shop: String(shop),
        customerId: String(customerId),
        productId: String(productId),
        variantId: String(variantId),
      },
    });

    return json({
      ok: true,
      wishlisted: true,
      action: "added",
      id: created.id,
      source,
    });
  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    return json({
      ok: false,
      error: e?.message || "Server error",
      stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      source,
    });
  }
}

export async function loader({ request }) {
  return handleToggle(request, "loader");
}

export async function action({ request }) {
  return handleToggle(request, "action");
}