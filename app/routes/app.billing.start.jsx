import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  if (billingDisabled) {
    return {
      mode: "redirect-app",
      target: host ? `/app?host=${encodeURIComponent(host)}` : "/app",
    };
  }

  const alreadyActive = await hasActiveWishlistSubscription(admin);

  if (alreadyActive) {
    return {
      mode: "redirect-app",
      target: host ? `/app?host=${encodeURIComponent(host)}` : "/app",
    };
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

  return {
    mode: "redirect-billing",
    target: confirmationUrl,
  };
}

export default function BillingStart() {
  const data = useLoaderData();

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

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var target = ${JSON.stringify(data?.target || "/app")};
              if (window.top && target) {
                window.top.location.href = target;
              } else if (target) {
                window.location.href = target;
              }
            })();
          `,
        }}
      />
    </div>
  );
}