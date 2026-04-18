// app/billing.server.js
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
) {
  appSubscriptionCreate(
    name: $name
    returnUrl: $returnUrl
    trialDays: $trialDays
    lineItems: $lineItems
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

    return subs.some(function(s) {
        return (
            s &&
            s.name === WISHLIST_PLAN.name &&
            s.status === "ACTIVE"
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

    const params = new URLSearchParams();
    params.set("shop", shop);
    if (host) params.set("host", host);

    const returnUrl = appUrl + "/app/billing/confirm?" + params.toString();

    const res = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION, {
        variables: {
            name: WISHLIST_PLAN.name,
            returnUrl: returnUrl,
            trialDays: WISHLIST_PLAN.trialDays,
            lineItems: [{
                plan: {
                    appRecurringPricingDetails: {
                        price: {
                            amount: WISHLIST_PLAN.price,
                            currencyCode: WISHLIST_PLAN.currency,
                        },
                    },
                },
            }, ],
        },
    });

    const payload = await res.json();

    const gqlErrors = payload && payload.errors ? payload.errors : null;
    if (gqlErrors && gqlErrors.length) {
        console.error("Shopify GraphQL errors:", gqlErrors);
        throw new Error("Shopify billing GraphQL error");
    }

    const data =
        payload &&
        payload.data &&
        payload.data.appSubscriptionCreate ?
        payload.data.appSubscriptionCreate :
        null;

    if (!data) throw new Error("Invalid response from Shopify");

    const userErrors = data.userErrors || [];
    if (userErrors.length) {
        const msg = userErrors[0] && userErrors[0].message ? userErrors[0].message : "Billing error";
        throw new Error(msg);
    }

    if (!data.confirmationUrl) {
        throw new Error("No confirmation URL returned by Shopify");
    }

    return data.confirmationUrl;
}