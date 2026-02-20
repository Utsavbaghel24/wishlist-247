// app/routes/proxy.toggle.jsx
import crypto from "crypto";
import prisma from "../db.server";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Allow POST without signature during dev.
// If signature exists, verify it.
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

/**
 * App Proxy-safe shop resolver:
 * - Prefer query param (?shop=...)
 * - Then Shopify header (x-shopify-shop-domain)
 * - Then x-forwarded-host if it contains .myshopify.com
 * - NEVER use tunnel host
 */
function getShop(request) {
  const url = new URL(request.url);

  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const hShop = request.headers.get("x-shopify-shop-domain");
  if (hShop) return hShop;

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
      // storefront-safe
      return json({ ok: false, error: "Invalid signature" }, 200);
    }

    const shop = getShop(request);
    if (!shop) {
      // storefront-safe: never 400/500
      return json({ ok: false, error: "Missing shop" }, 200);
    }

    const body = await readBody(request);

    const customerId = String(body.customerId || "guest");
    const productId = String(body.productId || "");
    const variantId = String(body.variantId || "");

    if (!productId || !variantId) {
      return json({ ok: false, error: "Missing productId or variantId" }, 200);
    }

    const key = {
      shop_customerId_variantId: {
        shop,
        customerId,
        variantId,
      },
    };

    const existing = await prisma.wishlistItem.findUnique({ where: key });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return json({ ok: true, wishlisted: false }, 200);
    }

    await prisma.wishlistItem.create({
      data: {
        shop,
        customerId,
        productId,
        variantId,
      },
    });

    return json({ ok: true, wishlisted: true }, 200);
  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    // storefront-safe
    return json({ ok: false, error: e?.message || "Server error" }, 200);
  }
}