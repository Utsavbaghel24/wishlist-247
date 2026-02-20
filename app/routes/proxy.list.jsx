// app/routes/proxy.list.jsx
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

/**
 * Hex-safe timing comparison
 */
function timingSafeEqualHex(a, b) {
  try {
    const ab = Buffer.from(String(a), "hex");
    const bb = Buffer.from(String(b), "hex");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * Proper Shopify App Proxy signature verification
 */
function verifyProxySignature(requestUrl) {
  const u = new URL(requestUrl);
  const params = u.searchParams;

  const signature = params.get("signature");

  // In production, signature must exist
  if (!signature) return false;

  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    entries.push([k, v]);
  }

  entries.sort(([a], [b]) => a.localeCompare(b));

  const message = entries.map(([k, v]) => `${k}=${v}`).join("");

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return timingSafeEqualHex(digest, signature);
}

/**
 * Get shop safely from App Proxy request
 */
function getShop(request) {
  const url = new URL(request.url);
  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const headerShop = request.headers.get("x-shopify-shop-domain");
  if (headerShop) return headerShop;

  return "";
}

export async function loader({ request }) {
  try {
    // 1️⃣ Verify App Proxy signature
    if (!verifyProxySignature(request.url)) {
      return json({ ok: false, items: [], error: "Invalid signature" }, 401);
    }

    const shop = getShop(request);

    if (!shop) {
      return json({ ok: false, items: [], error: "Missing shop" }, 200);
    }

    // 2️⃣ Check if wishlist feature enabled
    let enabled = true;
    try {
      const setting = await prisma.wishlistSetting.findUnique({
        where: { shop },
        select: { enabled: true },
      });
      enabled = setting?.enabled ?? true;
    } catch (e) {
      console.warn("wishlistSetting lookup failed (fail-open):", e?.message);
      enabled = true;
    }

    if (!enabled) {
      return json(
        { ok: false, disabled: true, items: [], error: "Wishlist disabled" },
        403
      );
    }

    // 3️⃣ Get customerId
    const url = new URL(request.url);
    const customerId = String(url.searchParams.get("customerId") || "guest");

    if (!customerId) {
      return json({ ok: true, items: [] }, 200);
    }

    // 4️⃣ Fetch wishlist items
    const items = await prisma.wishlistItem.findMany({
      where: { shop, customerId },
      orderBy: { createdAt: "desc" },
    });

    return json({ ok: true, items }, 200);
  } catch (e) {
    console.error("LIST ERROR:", e);
    return json({ ok: false, items: [], error: e?.message || "Server error" }, 200);
  }
}