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

export async function hasActiveWishlistSubscription(admin) {
  const res = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
  const json = await res.json();

  const subs =
    safeGet(json, "data.currentAppInstallation.activeSubscriptions", []) || [];

  return subs.some((s) => {
    return (
      s &&
      s.name === WISHLIST_PLAN.name &&
      (s.status === "ACTIVE" || s.status === "ACCEPTED")
    );
  });
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

  const returnUrl = `${cleanAppUrl}/app/billing/confirm?${params.toString()}`;

  const isTest =
    process.env.BILLING_TEST_MODE === "true" ||
    process.env.NODE_ENV !== "production";

  const res = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION, {
    variables: {
      name: WISHLIST_PLAN.name,
      returnUrl,
      trialDays: WISHLIST_PLAN.trialDays,
      test: isTest,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: WISHLIST_PLAN.price,
                currencyCode: WISHLIST_PLAN.currency,
              },
            },
          },
        },
      ],
    },
  });

  const payload = await res.json();

  if (payload?.errors?.length) {
    console.error("Shopify GraphQL errors:", payload.errors);
    throw new Error("Shopify billing GraphQL error");
  }

  const data = payload?.data?.appSubscriptionCreate;

  if (!data) {
    console.error("Invalid billing response:", payload);
    throw new Error("Invalid response from Shopify");
  }

  if (data.userErrors?.length) {
    console.error("Shopify billing userErrors:", data.userErrors);
    throw new Error(data.userErrors[0]?.message || "Billing error");
  }

  if (!data.confirmationUrl) {
    throw new Error("No confirmation URL returned by Shopify");
  }

  return data.confirmationUrl;
}