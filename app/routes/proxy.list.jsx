import prisma from "../db.server";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "";
    const customerId = url.searchParams.get("customerId") || "guest";

    const items = await prisma.wishlistItem.findMany({
      where: { shop, customerId },
    });

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}