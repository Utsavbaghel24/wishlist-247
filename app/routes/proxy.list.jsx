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

    if (!shop) {
      return json({ ok: false, items: [], error: "Missing shop" });
    }

    if (!prisma || !prisma.wishlistItem) {
      return json({ ok: false, items: [], error: "Prisma client not loaded" }, 500);
    }

    const items = await prisma.wishlistItem.findMany({
      where: {
        shop,
        customerId,
      },
      orderBy: { createdAt: "desc" },
    });

    return json({ ok: true, items });
  } catch (e) {
    console.error("LIST ERROR:", e);
    return json({ ok: false, items: [], error: e?.message || "Server error" }, 500);
  }
}