import prisma from "../../db.server";

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

export async function loader({ request }) {
  try {
    const { shop, customerId, productId, variantId } = readQuery(request);

    if (!shop) return json({ ok: false, error: "Missing shop" });
    if (!productId) return json({ ok: false, error: "Missing productId" });
    if (!variantId) return json({ ok: false, error: "Missing variantId" });

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
      });
    }

    await prisma.wishlistItem.create({
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
    });
  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    return json({
      ok: false,
      error: e?.message || "Server error",
    });
  }
}