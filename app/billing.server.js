import prisma from "./db.server";
import { WISHLIST_PLAN } from "./billing.plan";

/* ===============================
   GRAPHQL
================================ */
const CREATE_SUBSCRIPTION_MUTATION = `#graphql
mutation AppSubscriptionCreate(
  $name: String!
  $returnUrl: URL!
  $trialDays: Int
  $lineItems: [AppSubscriptionLineItemInput!]!
  $test: Boolean
) {
  appSubscriptionCreate(
    name: $name
    returnUrl: $returnUrl
    trialDays: $trialDays
    lineItems: $lineItems
    test: $test
  ) {
    confirmationUrl
    userErrors {
      message
      field
    }
  }
}
`;

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

const CANCEL_SUBSCRIPTION_MUTATION = `#graphql
mutation AppSubscriptionCancel($id: ID!, $prorate: Boolean) {
  appSubscriptionCancel(id: $id, prorate: $prorate) {
    appSubscription {
      id
      name
      status
    }
    userErrors {
      field
      message
    }
  }
}
`;

/* ===============================
   HELPERS
================================ */
function safeGet(obj, path, fallback) {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur === null || cur === undefined) return fallback;
      cur = cur[p];
    }
    return cur === undefined ? fallback : cur;
  } catch (e) {
    return fallback;
  }
}

/* ===============================
   SHOP / TRIAL HELPERS
================================ */
export async function getOrCreateShop(shopDomain) {
  let shop = await prisma.shop.findUnique({
    where: { id: shopDomain },
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        id: shopDomain,
        trialUsed: false,
      },
    });
  }

  return shop;
}

export async function hasConsumedTrial(shopDomain) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopDomain },
  });

  return !!shop?.trialUsed;
}

export async function markTrialUsed(shopDomain) {
  return prisma.shop.upsert({
    where: { id: shopDomain },
    update: { trialUsed: true },
    create: {
      id: shopDomain,
      trialUsed: true,
    },
  });
}

/* ===============================
   SUBSCRIPTION HELPERS
================================ */
export async function getActiveWishlistSubscription(admin) {
  const res = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
  const json = await res.json();

  const subs =
    safeGet(json, "data.currentAppInstallation.activeSubscriptions", []) || [];

  return (
    subs.find(
      (s) =>
        s &&
        s.name === WISHLIST_PLAN.name &&
        (s.status === "ACTIVE" || s.status === "ACCEPTED"),
    ) || null
  );
}

export async function hasActiveWishlistSubscription(admin) {
  const activeSub = await getActiveWishlistSubscription(admin);
  return !!activeSub;
}

export async function startWishlistSubscription({ admin, appUrl, shop, host }) {
  if (!appUrl) {
    throw new Error("Missing appUrl in startWishlistSubscription()");
  }

  if (!shop) {
    throw new Error("Missing shop in startWishlistSubscription()");
  }

  const cleanAppUrl = appUrl.replace(/\/+$/, "");

  const params = new URLSearchParams();
  params.set("shop", shop);
  if (host) params.set("host", host);

  // IMPORTANT:
  // returnUrl must be your APP domain, not admin.shopify.com
  const returnUrl = `${cleanAppUrl}/app/billing/confirm?${params.toString()}`;

  const isTest =
    process.env.BILLING_TEST_MODE === "true" ||
    process.env.NODE_ENV !== "production";

  const shopRecord = await getOrCreateShop(shop);
  const trialDays = shopRecord.trialUsed ? 0 : WISHLIST_PLAN.trialDays;

  const res = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION, {
    variables: {
      name: WISHLIST_PLAN.name,
      returnUrl,
      trialDays,
      test: isTest,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: Number(WISHLIST_PLAN.price),
                currencyCode: WISHLIST_PLAN.currency,
              },
              interval: "EVERY_30_DAYS",
            },
          },
        },
      ],
    },
  });

  let payload;
  try {
    payload = await res.json();
  } catch (e) {
    throw new Error("Could not parse Shopify billing response");
  }

  if (!res.ok) {
    console.error("Shopify billing HTTP error:", res.status, payload);
    throw new Error(
      `Shopify billing request failed with status ${res.status}`,
    );
  }

  if (payload?.errors?.length) {
    console.error(
      "Shopify GraphQL errors:",
      JSON.stringify(payload.errors, null, 2),
    );
    throw new Error(
      payload.errors.map((e) => e.message).join(", ") ||
        "Shopify billing GraphQL error",
    );
  }

  const data = payload?.data?.appSubscriptionCreate;

  if (!data) {
    console.error(
      "Invalid billing response:",
      JSON.stringify(payload, null, 2),
    );
    throw new Error("Invalid response from Shopify");
  }

  if (data.userErrors?.length) {
    console.error(
      "Shopify billing userErrors:",
      JSON.stringify(data.userErrors, null, 2),
    );
    throw new Error(
      data.userErrors.map((e) => e.message).join(", ") || "Billing error",
    );
  }

  if (!data.confirmationUrl) {
    console.error(
      "No confirmationUrl in payload:",
      JSON.stringify(payload, null, 2),
    );
    throw new Error("No confirmation URL returned by Shopify");
  }

  return data.confirmationUrl;
}

export async function cancelWishlistSubscription(admin) {
  const activeSub = await getActiveWishlistSubscription(admin);

  if (!activeSub?.id) {
    throw new Error("No active Wishlist subscription found");
  }

  const res = await admin.graphql(CANCEL_SUBSCRIPTION_MUTATION, {
    variables: {
      id: activeSub.id,
      prorate: true,
    },
  });

  const payload = await res.json();

  if (payload?.errors?.length) {
    console.error(
      "Shopify cancel GraphQL errors:",
      JSON.stringify(payload.errors, null, 2),
    );
    throw new Error(
      payload.errors.map((e) => e.message).join(", ") ||
        "Subscription cancel error",
    );
  }

  const data = payload?.data?.appSubscriptionCancel;

  if (!data) {
    console.error(
      "Invalid cancel response:",
      JSON.stringify(payload, null, 2),
    );
    throw new Error("Invalid response from Shopify on cancel");
  }

  if (data.userErrors?.length) {
    console.error(
      "Shopify cancel userErrors:",
      JSON.stringify(data.userErrors, null, 2),
    );
    throw new Error(
      data.userErrors.map((e) => e.message).join(", ") ||
        "Subscription cancel failed",
    );
  }

  return data.appSubscription;
}