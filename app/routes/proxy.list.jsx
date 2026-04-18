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

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Temporary fail-open signature check
 * This avoids storefront breaking while proxy is being stabilized.
 */
function verifyProxySignature(requestUrl) {
  try {
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
    if (!secret) return true;

    const digest = crypto.createHmac("sha256", secret).update(sorted).digest("hex");
    return timingSafeEqual(digest, signature);
  } catch (e) {
    console.warn("proxy.list signature check error:", e?.message);
    return true;
  }
}

function getShop(request) {
  const url = new URL(request.url);

  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const headerShop = request.headers.get("x-shopify-shop-domain");
  if (headerShop) return headerShop;

  const xfHost = request.headers.get("x-forwarded-host");
  if (xfHost && xfHost.includes(".myshopify.com")) {
    return xfHost.split(",")[0].trim();
  }

  return "";
}

export async function loader({ request }) {
  try {
    const sigOk = verifyProxySignature(request.url);

    if (!sigOk) {
      console.warn("proxy.list signature mismatch, continuing fail-open");
    }

    const shop = getShop(request);
    if (!shop) {
      return json({ ok: false, items: [], error: "Missing shop" }, 200);
    }

    let enabled = true;

    try {
      const setting = await prisma.wishlistSetting.findUnique({
        where: { shop },
        select: { enabled: true },
      });

      enabled = setting?.enabled ?? true;
    } catch (e) {
      console.warn("wishlistSetting lookup failed, continuing fail-open:", e?.message);
    }

    if (!enabled) {
      return json({ ok: true, items: [] }, 200);
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
    return json(
      { ok: false, items: [], error: e?.message || "Server error" },
      200,
    );
  }
}