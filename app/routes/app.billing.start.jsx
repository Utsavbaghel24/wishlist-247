import { authenticate, WISHLIST_PLAN } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { billing, redirect } = await authenticate.admin(request);

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    if (billingDisabled) {
      return redirect("/app", { target: "_self" });
    }

    const isTest =
      process.env.BILLING_TEST_MODE === "true" ||
      process.env.NODE_ENV !== "production";

    const billingCheck = await billing.check({
      plans: [WISHLIST_PLAN],
      isTest,
    });

    if (billingCheck.hasActivePayment) {
      return redirect("/app", { target: "_self" });
    }

    return await billing.request({
      plan: WISHLIST_PLAN,
      isTest,
      returnUrl: "/app/billing/confirm",
    });
  } catch (error) {
    console.error("Billing start failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown billing error";

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
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