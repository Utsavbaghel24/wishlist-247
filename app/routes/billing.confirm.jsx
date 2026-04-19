import { useEffect } from "react";
import { useLoaderData } from "react-router";

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

async function hasActiveWishlistSubscriptionByShop(shop, accessToken) {
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-10";

  const response = await fetch(
    `https://${shop}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `#graphql
          query ActiveSubscriptions {
            currentAppInstallation {
              activeSubscriptions {
                id
                name
                status
              }
            }
          }
        `,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(
      "Billing confirm GraphQL HTTP error:",
      response.status,
      text,
    );
    return false;
  }

  const payload = await response.json();
  const subscriptions =
    payload?.data?.currentAppInstallation?.activeSubscriptions || [];

  return subscriptions.some(
    (sub) =>
      sub &&
      sub.name === "Wishlist Pro" &&
      (sub.status === "ACTIVE" || sub.status === "ACCEPTED"),
  );
}

function buildEmbeddedAdminUrl(shop, host, path = "/app/pricing") {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!shop || !apiKey) {
    return "/app/pricing";
  }

  const params = new URLSearchParams();
  if (host) {
    params.set("host", host);
  }
  params.set("shop", shop);

  return `https://${shop}/admin/apps/${apiKey}${path}?${params.toString()}`;
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";

  if (!shop) {
    return json({
      ok: false,
      approved: false,
      redirectUrl: "/app/pricing",
      message: "Missing shop in billing confirmation URL.",
    });
  }

  const { default: prisma } = await import("../db.server");
  const { markTrialUsed } = await import("../billing.server");

  const offlineSession = await prisma.session.findFirst({
    where: {
      shop,
      isOnline: false,
    },
    orderBy: {
      id: "desc",
    },
  });

  const fallbackRedirect = buildEmbeddedAdminUrl(shop, host, "/app/pricing");

  if (!offlineSession?.accessToken) {
    console.error("No offline session found for shop:", shop);

    return json({
      ok: false,
      approved: false,
      redirectUrl: fallbackRedirect,
      message: "No offline session found. Redirecting back to app...",
    });
  }

  const isActive = await hasActiveWishlistSubscriptionByShop(
    shop,
    offlineSession.accessToken,
  );

  if (isActive) {
    await markTrialUsed(shop);

    return json({
      ok: true,
      approved: true,
      redirectUrl: fallbackRedirect,
      message: "Subscription approved. Redirecting back to the app...",
    });
  }

  return json({
    ok: true,
    approved: false,
    redirectUrl: fallbackRedirect,
    message: "Subscription not active yet. Redirecting back to pricing...",
  });
}

export default function BillingConfirm() {
  const data = useLoaderData();

  useEffect(() => {
    if (data?.redirectUrl) {
      window.top.location.replace(data.redirectUrl);
    }
  }, [data]);

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "60px auto",
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
            lineHeight: 1.2,
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Redirecting...
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: "0 0 18px 0",
          }}
        >
          {data?.message || "Taking you back to the app."}
        </p>

        <a
          href={data?.redirectUrl || "/app/pricing"}
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
          Continue
        </a>
      </div>
    </div>
  );
}