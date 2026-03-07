import crypto from "crypto";
import { data } from "react-router";
import prisma from "../db.server";

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

  const digest = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return timingSafeEqual(digest, signature);
}

function getShop(request) {
  const url = new URL(request.url);

  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const hShop = request.headers.get("x-shopify-shop-domain");
  if (hShop) return hShop;

  return "";
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    return await request.json();
  }

  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function action({ request }) {
  try {
    if (!verifyProxySignature(request.url)) {
      return data({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const shop = getShop(request);

    if (!shop) {
      return data({ ok: false, error: "Missing shop" });
    }

    const body = await readBody(request);

    const fromCustomerId = String(body.fromCustomerId || "");
    const toCustomerId = String(body.toCustomerId || "");

    if (!fromCustomerId || !toCustomerId) {
      return data({ ok: false, error: "Missing from/to" });
    }

    const guestItems = await prisma.wishlistItem.findMany({
      where: { shop, customerId: fromCustomerId },
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
      } catch {}
    }

    await prisma.wishlistItem.deleteMany({
      where: { shop, customerId: fromCustomerId },
    });

    return data({ ok: true, merged: guestItems.length });
  } catch (e) {
    return data({ ok: false, error: e?.message || "Server error" });
  }
}