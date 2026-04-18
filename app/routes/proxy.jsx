// app/routes/proxy.jsx
import crypto from "crypto";
import { data } from "react-router";
import { sessionStorage } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

/**
 * Verify Shopify App Proxy signature
 * App Proxy uses `signature` (not `hmac`)
 */
function verifyAppProxySignature(requestUrl, apiSecret) {
  const url = new URL(requestUrl);
  const params = url.searchParams;

  const signature = params.get("signature");
  if (!signature) return false;

  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    entries.push([k, v]);
  }

  entries.sort(([a], [b]) => a.localeCompare(b));

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

    if (!shop) {
      return data({ ok: false, error: "Missing shop" }, { status: 400 });
    }

    const okSig = verifyAppProxySignature(
      request.url,
      process.env.SHOPIFY_API_SECRET,
    );

    if (!okSig) {
      return data({ ok: false, error: "Invalid proxy signature" }, { status: 401 });
    }

    const offlineId = `offline_${shop}`;
    const offlineSession = await sessionStorage.loadSession(offlineId);

    if (!offlineSession?.accessToken) {
      return data(
        {
          ok: false,
          error: "Offline session missing. Please uninstall and reinstall the app.",
        },
        { status: 401 },
      );
    }

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

        const responseData = await resp.json();

        return {
          ok: resp.ok,
          status: resp.status,
          json: async () => responseData,
        };
      },
    };

    const isActive = await hasActiveWishlistSubscription(admin);

    if (!isActive) {
      return data(
        {
          ok: false,
          billingRequired: true,
          error: "Billing required. Please activate your plan in the app.",
        },
        { status: 402 },
      );
    }

    return data({ ok: true, message: "Proxy working", shop });
  } catch (e) {
    return data(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}