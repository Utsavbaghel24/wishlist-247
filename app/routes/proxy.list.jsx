// app/routes/proxy.list.jsx
import crypto from "crypto";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

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

function verifyProxySignature(requestUrl) {
  const u = new URL(requestUrl);
  const params = new URLSearchParams(u.search);

  const signature = params.get("signature");
  // During dev you may not have signature; allow
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
 * - Then Shopify header (x-shopify-shop-domain) if present
 * - Avoid using host of tunnel (cloudflare/ngrok) as shop
 */
function getShop(request) {
  const url = new URL(request.url);
  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const hShop = request.headers.get("x-shopify-shop-domain");
  if (hShop) return hShop;

  // Sometimes x-forwarded-host is the shop domain; try it cautiously
  const xfHost = request.headers.get("x-forwarded-host");
  if (xfHost && xfHost.includes(".myshopify.com")) {
    return xfHost.split(",")[0].trim();
  }

  return "";
}

export async function loader({ request }) {
  try {
    // Signature verify (dev-friendly)
    if (!verifyProxySignature(request.url)) {
      return json({ ok: false, items: [], error: "Invalid signature" }, 401);
    }

    const shop = getShop(request);

    // IMPORTANT: never throw here; return safe response
    if (!shop) {
      return json({ ok: false, items: [], error: "Missing shop" }, 200);
    }

    // SETTINGS gate (safe)
    let enabled = true;
    try {
      const setting = await prisma.wishlistSetting.findUnique({
        where: { shop },
        select: { enabled: true },
      });
      enabled = setting?.enabled ?? true;
    } catch (e) {
      // If wishlistSetting table/model isn't present, do NOT crash list
      console.warn("wishlistSetting lookup failed (fail-open):", e?.message);
      enabled = true;
    }

    if (!enabled) {
      return json(
        { ok: false, disabled: true, items: [], error: "Wishlist is disabled." },
        403
      );
    }

    // BILLING gate (FAIL-SAFE for App Proxy)
    const billingDisabled =
      process.env.BILLING_DISABLED === "true" || process.env.BYPASS_BILLING === "1";

    if (!billingDisabled) {
      try {
        // NOTE: App Proxy requests often don't have admin auth context.
        // If this fails, we fail-open so wishlist doesn't break on storefront.
        const { admin } = await authenticate.public(request);
        const isActive = await hasActiveWishlistSubscription(admin);

        if (!isActive) {
          return json(
            {
              ok: false,
              items: [],
              billingRequired: true,
              error: "Billing required.",
            },
            402
          );
        }
      } catch (err) {
        console.warn("Billing check skipped in proxy.list (fail-open):", err?.message);
      }
    }

    const url = new URL(request.url);
    const customerId = String(url.searchParams.get("customerId") || "guest");

    // If customerId missing, return empty (never 500)
    if (!customerId) {
      return json({ ok: true, items: [] }, 200);
    }

    const items = await prisma.wishlistItem.findMany({
      where: { shop, customerId },
      orderBy: { createdAt: "desc" },
    });

    return json({ ok: true, items }, 200);
  } catch (e) {
    console.error("LIST ERROR:", e);
    // IMPORTANT: never return 500 to storefront; keep UI stable
    return json({ ok: false, items: [], error: e?.message || "Server error" }, 200);
  }
}