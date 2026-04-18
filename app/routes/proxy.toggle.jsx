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

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const shop = String(url.searchParams.get("shop") || "");
    const customerId = String(url.searchParams.get("customerId") || "guest");
    const productId = String(url.searchParams.get("productId") || "");
    const variantId = String(url.searchParams.get("variantId") || "");

    if (!shop) return json({ ok: false, error: "Missing shop" });
    if (!productId) return json({ ok: false, error: "Missing productId" });
    if (!variantId) return json({ ok: false, error: "Missing variantId" });

    if (!prisma || !prisma.wishlistItem) {
      return json({ ok: false, error: "Prisma client not loaded" }, 500);
    }

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
  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}