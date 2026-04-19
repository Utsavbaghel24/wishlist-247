import { redirect } from "react-router";

const PLAN_NAME = "Wishlist Pro";

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

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error("Billing confirm JSON parse error:", error);
    return false;
  }

  const subscriptions =
    result?.data?.currentAppInstallation?.activeSubscriptions || [];

  return subscriptions.some(
    (sub) =>
      sub &&
      sub.name === PLAN_NAME &&
      (sub.status === "ACTIVE" || sub.status === "ACCEPTED"),
  );
}

function buildAdminAppUrl(shop, host, path = "/app/pricing") {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!shop || !apiKey) {
    return "/app/pricing";
  }

  const params = new URLSearchParams();
  params.set("shop", shop);

  if (host) {
    params.set("host", host);
  }

  return `https://${shop}/admin/apps/${apiKey}${path}?${params.toString()}`;
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";

  if (!shop) {
    return redirect("/app/pricing");
  }

  const { default: prisma } = await import("../db.server");
  const { markTrialUsed } = await import("../billing.server");

  const fallbackRedirect = buildAdminAppUrl(shop, host, "/app/pricing");

  try {
    const offlineSession = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!offlineSession?.accessToken) {
      console.error("No offline session found for shop:", shop);
      return redirect(fallbackRedirect);
    }

    const isActive = await hasActiveWishlistSubscriptionByShop(
      shop,
      offlineSession.accessToken,
    );

    if (isActive) {
      await markTrialUsed(shop);
    } else {
      console.warn("Subscription not active yet for shop:", shop);
    }

    return redirect(fallbackRedirect);
  } catch (error) {
    console.error("Billing confirm loader error:", error);
    return redirect(fallbackRedirect);
  }
}

export default function BillingConfirm() {
  return null;
}