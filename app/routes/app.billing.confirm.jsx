import { redirect } from "react-router";
import prisma from "../db.server";
import { markTrialUsed } from "../billing.server";

const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
query ActiveSubscriptions {
  currentAppInstallation {
    activeSubscriptions {
      id
      name
      status
    }
  }
}
`;

function buildEmbeddedAppUrl(shop, host, path = "") {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!shop || !apiKey) {
    return path || "/app";
  }

  const normalizedPath = path
    ? path.startsWith("/") ? path : `/${path}`
    : "";

  const params = new URLSearchParams();
  if (host) {
    params.set("host", host);
  }

  const query = params.toString();
  return `https://${shop}/admin/apps/${apiKey}${normalizedPath}${query ? `?${query}` : ""}`;
}

async function hasActiveWishlistSubscriptionByShop(shop) {
  const offlineSession = await prisma.session.findFirst({
    where: {
      shop,
      isOnline: false,
    },
  });

  if (!offlineSession?.accessToken) {
    console.error("No offline session found for shop:", shop);
    return false;
  }

  const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-10";

  const response = await fetch(
    `https://${shop}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": offlineSession.accessToken,
      },
      body: JSON.stringify({
        query: ACTIVE_SUBSCRIPTIONS_QUERY,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Billing confirm GraphQL HTTP error:", response.status, text);
    return false;
  }

  const json = await response.json();
  const subscriptions =
    json?.data?.currentAppInstallation?.activeSubscriptions || [];

  return subscriptions.some(
    (sub) =>
      sub &&
      sub.name === "Wishlist Pro" &&
      (sub.status === "ACTIVE" || sub.status === "ACCEPTED"),
  );
}

export async function loader({ request }) {
  const url = new URL(request.url);

  const shop = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";

  const appUrl = buildEmbeddedAppUrl(shop, host);
  const pricingUrl = buildEmbeddedAppUrl(shop, host, "/pricing");

  if (!shop) {
    throw redirect("/app/pricing");
  }

  const isActive = await hasActiveWishlistSubscriptionByShop(shop);

  if (isActive) {
    await markTrialUsed(shop);
    throw redirect(appUrl);
  }

  throw redirect(pricingUrl);
}

export default function BillingConfirm() {
  return null;
}