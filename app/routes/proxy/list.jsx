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

    if (!shop) {
      return json({ ok: false, error: "Missing shop", items: [] });
    }

    const items = await prisma.wishlistItem.findMany({
      where: {
        shop: String(shop),
        customerId: String(customerId),
      },
      orderBy: { createdAt: "desc" },
    });

    return json({
      ok: true,
      items,
    });
  } catch (e) {
    console.error("LIST ERROR:", e);
    return json({
      ok: false,
      error: e?.message || "Server error",
      items: [],
    });
  }
}