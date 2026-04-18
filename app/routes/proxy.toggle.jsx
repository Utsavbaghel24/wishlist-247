import prisma from "../db.server";

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getShop(request) {
  const url = new URL(request.url);
  return url.searchParams.get("shop") || "";
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const shop = getShop(request);
    const customerId = url.searchParams.get("customerId") || "guest";
    const productId = url.searchParams.get("productId");
    const variantId = url.searchParams.get("variantId");

    if (!shop || !productId || !variantId) {
      return json({ ok: false, error: "Missing params" });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { shop, customerId, variantId },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });

      return json({ ok: true, wishlisted: false });
    }

    await prisma.wishlistItem.create({
      data: { shop, customerId, productId, variantId },
    });

    return json({ ok: true, wishlisted: true });

  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    return json({ ok: false, error: e.message });
  }
}