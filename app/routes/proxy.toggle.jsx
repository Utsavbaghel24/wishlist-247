import prisma from "../db.server";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const shop = url.searchParams.get("shop");
    const customerId = url.searchParams.get("customerId") || "guest";
    const productId = url.searchParams.get("productId");
    const variantId = url.searchParams.get("variantId");

    if (!shop || !productId || !variantId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing params" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { shop, customerId, variantId },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return new Response(JSON.stringify({ ok: true, wishlisted: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.wishlistItem.create({
      data: { shop, customerId, productId, variantId },
    });

    return new Response(JSON.stringify({ ok: true, wishlisted: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}