// app/utils/register-webhooks.server.js

import { authenticate } from "../shopify.server";

/**
 * Registers required Shopify webhooks after app install / OAuth.
 * Topics:
 *  - APP_UNINSTALLED
 *  - CUSTOMERS_DATA_REQUEST
 *  - CUSTOMERS_REDACT
 *  - SHOP_REDACT
 */
export async function registerRequiredWebhooks(request) {
    // Authenticate and get Admin API + session
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session) {
        console.warn("⚠️ Webhook registration skipped: no admin/session");
        return { ok: false };
    }

    const shop = session.shop;

    // Your webhook endpoint (must be HTTPS in production)
    const endpoint = `${process.env.SHOPIFY_APP_URL}/webhooks`;

    if (!process.env.SHOPIFY_APP_URL) {
        console.error("❌ SHOPIFY_APP_URL missing in .env");
        return { ok: false };
    }

    // Required webhook topics
    const topics = [
        "APP_UNINSTALLED",
        "CUSTOMERS_DATA_REQUEST",
        "CUSTOMERS_REDACT",
        "SHOP_REDACT",
    ];

    const mutation = `
    mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
      webhookSubscriptionCreate(
        topic: $topic,
        webhookSubscription: {
          callbackUrl: $callbackUrl,
          format: JSON
        }
      ) {
        userErrors {
          field
          message
        }
        webhookSubscription {
          id
          topic
        }
      }
    }
  `;

    for (const topic of topics) {
        try {
            const response = await admin.graphql(mutation, {
                variables: {
                    topic,
                    callbackUrl: endpoint,
                },
            });
            const data = await response.json();

            const errors =
                data &&
                data.data &&
                data.data.webhookSubscriptionCreate &&
                data.data.webhookSubscriptionCreate.userErrors ?
                data.data.webhookSubscriptionCreate.userErrors :
                [];
            if (errors.length) {
                console.warn("⚠️ Webhook create errors:", topic, errors);
            } else {
                console.log("✅ Webhook registered:", topic, shop);
            }
        } catch (err) {
            console.error("🔥 Failed to register webhook:", topic, err);
        }
    }

    return { ok: true };
}