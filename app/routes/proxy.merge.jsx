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

async function readBody(request) {
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function action({ request }) {
  try {
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
    console.error("MERGE ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}