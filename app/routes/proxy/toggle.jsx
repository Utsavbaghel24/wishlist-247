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

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const shop = url.searchParams.get("shop") || "";
    const customerId = url.searchParams.get("customerId") || "guest";
    const productId = url.searchParams.get("productId") || "";
    const variantId = url.searchParams.get("variantId") || "";

    if (!shop) {
      return json({ ok: false, error: "Missing shop" });
    }

    if (!productId) {
      return json({ ok: false, error: "Missing productId" });
    }

    if (!variantId) {
      return json({ ok: false, error: "Missing variantId" });
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