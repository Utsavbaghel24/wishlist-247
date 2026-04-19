import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session, redirect } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  if (billingDisabled) {
    return redirect(host ? `/app?host=${encodeURIComponent(host)}` : "/app", {
      target: "_self",
    });
  }

  const alreadyActive = await hasActiveWishlistSubscription(admin);

  if (alreadyActive) {
    return redirect(host ? `/app?host=${encodeURIComponent(host)}` : "/app", {
      target: "_self",
    });
  }

  const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing SHOPIFY_APP_URL or APP_URL");
  }

  const confirmationUrl = await startWishlistSubscription({
    admin,
    appUrl,
    shop: session.shop,
    host,
  });

  return redirect(confirmationUrl, {
    target: "_top",
  });
}

export default function BillingStart() {
  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Redirecting…
        </h1>

        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: 0,
          }}
        >
          Please wait while Wishlist247 opens the Shopify billing approval page.
        </p>
      </div>
    </div>
  );
}