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

function hmacHex(secret, msg) {
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

/**
 * ✅ App Proxy signature verification (tries BOTH decoded + raw styles)
 * Accept if either digest matches Shopify's `signature`.
 */
function verifyProxySignature(requestUrl) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return { ok: false, reason: "Missing SHOPIFY_API_SECRET" };

  const u = new URL(requestUrl);
  const params = u.searchParams;

  const signature = params.get("signature");
  if (!signature) return { ok: false, reason: "Missing signature" };

  // 1) DECODED message (URLSearchParams gives decoded values)
  const decodedEntries = [];
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    decodedEntries.push([k, v]);
  }
  decodedEntries.sort(([a], [b]) => a.localeCompare(b));
  const decodedMsg = decodedEntries.map(([k, v]) => `${k}=${v}`).join("");
  const decodedDigest = hmacHex(secret, decodedMsg);

  if (timingSafeEqualHex(decodedDigest, signature)) {
    return { ok: true, mode: "decoded" };
  }

  // 2) RAW message (use raw querystring, keep values encoded)
  const raw = u.search.startsWith("?") ? u.search.slice(1) : u.search;

  const rawPairs = raw
    .split("&")
    .filter(Boolean)
    .map((kv) => {
      const idx = kv.indexOf("=");
      if (idx === -1) return [kv, ""];
      return [kv.slice(0, idx), kv.slice(idx + 1)];
    });

  const rawFiltered = rawPairs.filter(([k]) => k !== "signature");
  rawFiltered.sort(([a], [b]) => a.localeCompare(b));
  const rawMsg = rawFiltered.map(([k, v]) => `${k}=${v}`).join("");
  const rawDigest = hmacHex(secret, rawMsg);

  if (timingSafeEqualHex(rawDigest, signature)) {
    return { ok: true, mode: "raw" };
  }

  // If neither matched, return debug info (logged only)
  return {
    ok: false,
    reason: "Signature mismatch",
    debug: {
      decodedMsg,
      decodedDigest,
      rawMsg,
      rawDigest,
      signature,
    },
  };
}

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
    const sig = verifyProxySignature(request.url);
    if (!sig.ok) {
      console.warn("proxy.list signature failed:", sig.reason, sig.debug || "");
      return json({ ok: false, items: [], error: "Invalid signature" }, 401);
    }

    const shop = getShop(request);
    if (!shop) return json({ ok: false, items: [], error: "Missing shop" }, 200);

    // Optional enabled gate (fail-open)
    let enabled = true;
    try {
      const setting = await prisma.wishlistSetting.findUnique({
        where: { shop },
        select: { enabled: true },
      });
      enabled = setting?.enabled ?? true;
    } catch (e) {
      console.warn("wishlistSetting lookup failed (fail-open):", e?.message);
    }

    if (!enabled) {
      return json(
        { ok: false, disabled: true, items: [], error: "Wishlist disabled" },
        403
      );
    }

    const url = new URL(request.url);
    const customerId = String(url.searchParams.get("customerId") || "guest");

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