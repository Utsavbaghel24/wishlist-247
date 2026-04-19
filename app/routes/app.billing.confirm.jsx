import { redirect, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  markTrialUsed,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";
  const shop = session?.shop || url.searchParams.get("shop") || "";

  const isActive = await hasActiveWishlistSubscription(admin);

  const appUrl = shop
    ? `/app?shop=${encodeURIComponent(shop)}${
        host ? `&host=${encodeURIComponent(host)}` : ""
      }`
    : host
      ? `/app?host=${encodeURIComponent(host)}`
      : "/app";

  const pricingUrl = shop
    ? `/app/pricing?shop=${encodeURIComponent(shop)}${
        host ? `&host=${encodeURIComponent(host)}` : ""
      }`
    : host
      ? `/app/pricing?host=${encodeURIComponent(host)}`
      : "/app/pricing";

  if (isActive) {
    if (shop) {
      await markTrialUsed(shop);
    }

    throw redirect(appUrl);
  }

  return {
    ok: false,
    host,
    shop,
    pricingUrl,
    message:
      "Subscription not active yet. Please approve the charge in Shopify and try again.",
  };
}

export default function BillingConfirm() {
  const data = useLoaderData();

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #fecaca",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#fef2f2",
            color: "#b42318",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "14px",
          }}
        >
          Billing not approved
        </div>

        <h1
          style={{
            fontSize: "30px",
            lineHeight: 1.2,
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Subscription not active
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: "0 0 18px 0",
          }}
        >
          {data?.message}
        </p>

        <a
          href={data?.pricingUrl || "/app/pricing"}
          style={{
            display: "inline-block",
            background: "#111827",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Back to Pricing
        </a>
      </div>
    </div>
  );
}