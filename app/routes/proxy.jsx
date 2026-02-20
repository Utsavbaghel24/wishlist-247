// app/routes/proxy.jsx
import crypto from "crypto";
import { json } from "@remix-run/node";
import { sessionStorage } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

/**
 * ✅ Verify Shopify App Proxy signature
 * App Proxy uses `signature` (NOT `hmac`).
 */
function verifyAppProxySignature(requestUrl, apiSecret) {
  const url = new URL(requestUrl);
  const params = url.searchParams;

  const signature = params.get("signature");
  if (!signature) return false;

  // Collect all params except signature
  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    entries.push([k, v]);
  }

  // Sort by key
  entries.sort(([a], [b]) => a.localeCompare(b));

  // Build message as key=value concatenation (no separators)
  const message = entries.map(([k, v]) => `${k}=${v}`).join("");

  const digest = crypto
    .createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    // 1) Must have shop
    if (!shop) {
      return json({ ok: false, error: "Missing shop" }, { status: 400 });
    }

    // 2) Verify proxy signature
    const okSig = verifyAppProxySignature(request.url, process.env.SHOPIFY_API_SECRET);
    if (!okSig) {
      return json({ ok: false, error: "Invalid proxy signature" }, { status: 401 });
    }

    // 3) Load offline session (required if you want billing/admin access)
    const offlineId = `offline_${shop}`;
    const offlineSession = await sessionStorage.loadSession(offlineId);

    if (!offlineSession?.accessToken) {
      return json(
        {
          ok: false,
          error: "Offline session missing. Please uninstall and reinstall the app.",
        },
        { status: 401 }
      );
    }

    // 4) Billing gate (uses Admin API via accessToken)
    // Build a minimal admin GraphQL caller (no need authenticate.public/admin here)
    const admin = {
      graphql: async (query, options = {}) => {
        const resp = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": offlineSession.accessToken,
          },
          body: JSON.stringify({
            query,
            variables: options.variables || {},
          }),
        });

        const data = await resp.json();
        return {
          ok: resp.ok,
          status: resp.status,
          json: async () => data,
        };
      },
    };

    const isActive = await hasActiveWishlistSubscription(admin);

    if (!isActive) {
      return json(
        {
          ok: false,
          billingRequired: true,
          error: "Billing required. Please activate your plan in the app.",
        },
        { status: 402 }
      );
    }

    // ✅ Success
    return json({ ok: true, message: "Proxy working", shop });
  } catch (e) {
    return json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}