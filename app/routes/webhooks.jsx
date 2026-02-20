// app/routes/webhooks.jsx
import prisma from "../db.server";
import { verifyShopifyWebhook } from "../utils/webhook-verify.server";

function ok(status = 200) {
  return new Response("ok", { status });
}

async function safeJson(request) {
  const raw = await request.text(); // IMPORTANT: raw body for HMAC verification
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    json = null;
  }
  return { raw, json };
}

async function purgeShopData(shop) {
  if (!shop) return;

  // Delete wishlist data
  await prisma.wishlistItem.deleteMany({ where: { shop } });

  // Delete settings tables (optional but recommended)
  try {
    await prisma.wishlistSetting.deleteMany({ where: { shop } });
  } catch (_) {}

  try {
    await prisma.shopSettings.deleteMany({ where: { shop } });
  } catch (_) {}

  // Delete Shopify sessions (important)
  await prisma.session.deleteMany({ where: { shop } });
}

export async function action({ request }) {
  // Shopify sends POST webhooks
  if (request.method !== "POST") return ok(405);

  const topic =
    request.headers.get("x-shopify-topic") ||
    request.headers.get("X-Shopify-Topic") ||
    "";

  const shop =
    request.headers.get("x-shopify-shop-domain") ||
    request.headers.get("X-Shopify-Shop-Domain") ||
    "";

  const { raw, json } = await safeJson(request);

  // ✅ Verify webhook authenticity
  const isValid = verifyShopifyWebhook(request, raw);
  if (!isValid) {
    console.error("❌ Webhook HMAC verification failed", { topic, shop });
    return ok(401);
  }

  try {
    // ✅ 1) APP UNINSTALLED (required)
    if (topic === "app/uninstalled") {
      console.log("✅ APP_UNINSTALLED received for", shop);
      await purgeShopData(shop);
      return ok(200);
    }

    // ✅ 2) GDPR: CUSTOMER DATA REQUEST
    if (topic === "customers/data_request") {
      // Shopify expects 200 quickly. If you need to email them data, do it async (optional).
      console.log("✅ GDPR customers/data_request", { shop, payload: json });
      return ok(200);
    }

    // ✅ 3) GDPR: CUSTOMER REDACT
    if (topic === "customers/redact") {
      // You can optionally delete customer-specific wishlist rows if they exist.
      // But your customerId is a string, may match Shopify customer id.
      try {
        const customerId = json?.customer?.id ? String(json.customer.id) : null;
        if (customerId) {
          await prisma.wishlistItem.deleteMany({
            where: { shop, customerId },
          });
        }
      } catch (e) {
        console.warn("customers/redact cleanup skipped", e?.message);
      }

      console.log("✅ GDPR customers/redact", { shop });
      return ok(200);
    }

    // ✅ 4) GDPR: SHOP REDACT
    if (topic === "shop/redact") {
      console.log("✅ GDPR shop/redact", { shop });
      await purgeShopData(shop);
      return ok(200);
    }

    // Unknown webhook topics should still return 200 to avoid retries
    console.log("ℹ️ Webhook topic ignored:", topic, "shop:", shop);
    return ok(200);
  } catch (err) {
    console.error("🔥 Webhook handler error", err);
    // Return 200 anyway to stop Shopify from retry spam in some cases
    return ok(200);
  }
}