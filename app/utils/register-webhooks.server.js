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
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session) {
        console.warn("⚠️ Webhook registration skipped: no admin/session");
        return { ok: false };
    }

    const shop = session.shop;
    const baseUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

    if (!baseUrl) {
        console.error("❌ Missing SHOPIFY_APP_URL or APP_URL");
        return { ok: false };
    }

    const webhookTargets = [{
            topic: "APP_UNINSTALLED",
            callbackUrl: `${baseUrl}/webhooks/app/uninstalled`,
        },
        {
            topic: "CUSTOMERS_DATA_REQUEST",
            callbackUrl: `${baseUrl}/webhooks`,
        },
        {
            topic: "CUSTOMERS_REDACT",
            callbackUrl: `${baseUrl}/webhooks`,
        },
        {
            topic: "SHOP_REDACT",
            callbackUrl: `${baseUrl}/webhooks`,
        },
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

    for (const item of webhookTargets) {
        try {
            const response = await admin.graphql(mutation, {
                variables: {
                    topic: item.topic,
                    callbackUrl: item.callbackUrl,
                },
            });

            const data = await response.json();

            const errors =
                data ? .data ? .webhookSubscriptionCreate ? .userErrors || [];

            if (errors.length) {
                console.warn("⚠️ Webhook create errors:", item.topic, errors);
            } else {
                console.log("✅ Webhook registered:", item.topic, shop);
            }
        } catch (err) {
            console.error("🔥 Failed to register webhook:", item.topic, err);
        }
    }

    return { ok: true };
}