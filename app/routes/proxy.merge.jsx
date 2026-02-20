import crypto from "crypto";
import prisma from "../db.server";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifyProxySignature(requestUrl) {
  const u = new URL(requestUrl);
  const params = new URLSearchParams(u.search);
  const signature = params.get("signature");
  if (!signature) return true;

  params.delete("signature");
  const sorted = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("");

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const digest = crypto.createHmac("sha256", secret).update(sorted).digest("hex");
  return timingSafeEqual(digest, signature);
}

function getShop(request) {
  const url = new URL(request.url);

  // ✅ 1) Prefer ?shop=
  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  // ✅ 2) Shopify proxy header
  const hShop = request.headers.get("x-shopify-shop-domain");
  if (hShop) return hShop;

  // ✅ 3) forwarded host sometimes contains shop
  const xfHost = request.headers.get("x-forwarded-host");
  if (xfHost && xfHost.includes(".myshopify.com")) {
    return xfHost.split(",")[0].trim();
  }

  return "";
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await request.json();
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function action({ request }) {
  try {
    if (!verifyProxySignature(request.url)) {
      return json({ ok: false, error: "Invalid signature" }, 401);
    }

    const shop = getShop(request);
    if (!shop) return json({ ok: false, error: "Missing shop" }, 200);

    const body = await readBody(request);

    const fromCustomerId = String(body.fromCustomerId || "");
    const toCustomerId = String(body.toCustomerId || "");

    if (!fromCustomerId || !toCustomerId) {
      return json({ ok: false, error: "Missing from/to" }, 200);
    }

    const guestItems = await prisma.wishlistItem.findMany({
      where: { shop, customerId: fromCustomerId },
      orderBy: { createdAt: "desc" },
    });

    for (const item of guestItems) {
      try {
        await prisma.wishlistItem.upsert({
          where: {
            shop_customerId_variantId: {
              shop,
              customerId: toCustomerId,
              variantId: item.variantId,
            },
          },
          update: { productId: item.productId },
          create: {
            shop,
            customerId: toCustomerId,
            productId: item.productId,
            variantId: item.variantId,
          },
        });
      } catch (err) {
        // ignore any weird duplicate edge cases
      }
    }

    await prisma.wishlistItem.deleteMany({
      where: { shop, customerId: fromCustomerId },
    });

    return json({ ok: true, merged: guestItems.length }, 200);
  } catch (e) {
    console.error("MERGE ERROR:", e);
    return json({ ok: false, error: e?.message || "Server error" }, 200);
  }
}