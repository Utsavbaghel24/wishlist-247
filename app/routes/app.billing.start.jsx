import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

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
  try {
    const { admin, session } = await authenticate.admin(request);

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    const url = new URL(request.url);
    const host = url.searchParams.get("host") || "";

    if (billingDisabled) {
      return json({
        ok: true,
        redirectTo: host ? `/app?host=${encodeURIComponent(host)}` : "/app",
        target: "_self",
      });
    }

    const alreadyActive = await hasActiveWishlistSubscription(admin);

    if (alreadyActive) {
      return json({
        ok: true,
        redirectTo: host ? `/app?host=${encodeURIComponent(host)}` : "/app",
        target: "_self",
      });
    }

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

    if (!appUrl) {
      throw new Error("Missing SHOPIFY_APP_URL or APP_URL");
    }

    if (!session?.shop) {
      throw new Error("Missing session.shop");
    }

    const confirmationUrl = await startWishlistSubscription({
      admin,
      appUrl,
      shop: session.shop,
      host,
    });

    return json({
      ok: true,
      redirectTo: confirmationUrl,
      target: "_top",
    });
  } catch (error) {
    console.error("Billing start loader failed:", error);

    return json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown billing start error",
    });
  }
}

export default function BillingStart() {
  const data = useLoaderData();

  if (!data?.ok) {
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
            border: "1px solid #fecaca",
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
            Billing Start Error
          </h1>

          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#b42318",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {data?.error || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

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
              var url = ${JSON.stringify(data?.redirectTo || "")};
              if (!url) return;
              if (window.top) {
                window.top.location.href = url;
              } else {
                window.location.href = url;
              }
            })();
          `,
        }}
      />
    </div>
  );
}