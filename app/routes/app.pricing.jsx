import { useLoaderData, useFetcher, Link } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  hasActiveWishlistSubscription,
  cancelWishlistSubscription,
  getOrCreateShop,
} from "../billing.server";
import { WISHLIST_PLAN } from "../billing.plan";

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  let isActive = false;

  if (billingDisabled) {
    isActive = true;
  } else {
    isActive = await hasActiveWishlistSubscription(admin);
  }

  const shopRecord = await getOrCreateShop(session.shop);

  return json({
    plan: WISHLIST_PLAN,
    isActive,
    shop: session.shop,
    host,
    trialUsed: !!shopRecord?.trialUsed,
  });
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "cancel_subscription") {
    await cancelWishlistSubscription(admin);
    return json({ ok: true, cancelled: true });
  }

  return json({ ok: false, message: "Invalid action" }, { status: 400 });
}

export default function Pricing() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const plan = data?.plan || WISHLIST_PLAN;
  const isActive = !!data?.isActive;
  const host = data?.host || "";
  const trialUsed = !!data?.trialUsed;

  const startBillingUrl = host
    ? `/app/billing/start?host=${encodeURIComponent(host)}`
    : `/app/billing/start`;

  const isCancelling =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "cancel_subscription";

  const cancelled =
    fetcher.data?.ok === true && fetcher.data?.cancelled === true;

  const showActive = cancelled ? false : isActive;

  const badgeText = showActive
    ? "Subscription Active"
    : trialUsed
      ? "Subscription Required"
      : `${plan.trialDays}-Day Free Trial`;

  const buttonText = trialUsed
    ? "Subscribe Now"
    : `Start ${plan.trialDays}-Day Free Trial`;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1100px",
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
          marginBottom: "22px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "999px",
            background: showActive ? "#ecfdf3" : "#eef6ff",
            color: showActive ? "#027a48" : "#1d4ed8",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "14px",
          }}
        >
          {badgeText}
        </div>

        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.2,
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Wishlist247 Pricing
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: 0,
          }}
        >
          Activate <strong>{plan.name}</strong> to enable Wishlist247 for your
          storefront. This includes the product page wishlist button, floating
          wishlist icon, and dedicated wishlist page with add-to-cart and remove
          actions.
        </p>
      </div>

      <div
        className="wishlist247-pricing-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.9fr)",
          gap: "22px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              margin: "0 0 14px 0",
              color: "#111827",
            }}
          >
            {plan.name}
          </h2>

          <p
            style={{
              margin: "0 0 16px 0",
              color: "#4b5563",
              lineHeight: 1.7,
              fontSize: "15px",
            }}
          >
            Wishlist247 is built for merchants who want a clean, fast, and
            reliable saved-products experience without clutter.
          </p>

          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#4b5563",
              lineHeight: 1.9,
              fontSize: "15px",
            }}
          >
            <li>Wishlist button on product pages</li>
            <li>Floating wishlist icon with live count</li>
            <li>Dedicated wishlist page</li>
            <li>Remove items from wishlist</li>
            <li>Add saved products directly to cart</li>
            <li>Billing-protected access for active merchants</li>
          </ul>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "10px",
            }}
          >
            ${plan.price}
            <span
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#6b7280",
                marginLeft: "6px",
              }}
            >
              /month
            </span>
          </div>

          <p
            style={{
              margin: "0 0 16px 0",
              color: "#6b7280",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            {trialUsed
              ? `Subscribe for $${plan.price}/month. Trial already used on this store.`
              : `${plan.trialDays}-day free trial, then $${plan.price}/month. Cancel anytime.`}
          </p>

          {showActive ? (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="cancel_subscription" />
              <button
                type="submit"
                disabled={isCancelling}
                style={{
                  width: "100%",
                  background: isCancelling ? "#e5e7eb" : "#111827",
                  color: isCancelling ? "#6b7280" : "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isCancelling ? "not-allowed" : "pointer",
                }}
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </fetcher.Form>
          ) : (
            <Link
              to={startBillingUrl}
              style={{
                width: "100%",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                textDecoration: "none",
                background: "#111827",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "14px 18px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {buttonText}
            </Link>
          )}

          {cancelled ? (
            <p
              style={{
                marginTop: "12px",
                fontSize: "14px",
                color: "#027a48",
                lineHeight: 1.6,
              }}
            >
              Subscription cancelled successfully. Refresh once to see the latest status.
            </p>
          ) : null}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .wishlist247-pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}