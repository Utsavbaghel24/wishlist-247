// app/routes/webhooks.jsx
import prisma from "../db.server";
import { verifyShopifyWebhook } from "../utils/webhook-verify.server";

function ok(status = 200) {
  return new Response("ok", { status });
}

async function safeJson(request) {
  const raw = await request.text();
  let json = null;

  try {
    json = JSON.parse(raw);
  } catch (_) {
    json = null;
  }

  return { raw, json };
}

async function purgeShopData(shop) {
  if (!shop) return;

  await prisma.wishlistItem.deleteMany({
    where: { shop },
  });

  try {
    await prisma.wishlistSetting.deleteMany({
      where: { shop },
    });
  } catch (_) {}

  try {
    await prisma.shopSettings.deleteMany({
      where: { shop },
    });
  } catch (_) {}

  await prisma.session.deleteMany({
    where: { shop },
  });
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return ok(405);
  }

  const topic =
    request.headers.get("x-shopify-topic") ||
    request.headers.get("X-Shopify-Topic") ||
    "";

  const shop =
    request.headers.get("x-shopify-shop-domain") ||
    request.headers.get("X-Shopify-Shop-Domain") ||
    "";

  const { raw, json } = await safeJson(request);

  const isValid = verifyShopifyWebhook(request, raw);
  if (!isValid) {
    console.error("Webhook HMAC verification failed", { topic, shop });
    return ok(401);
  }

  try {
    // Keep this too, in case any webhook is still pointed to /webhooks
    if (topic === "app/uninstalled") {
      console.log("APP_UNINSTALLED received for", shop);
      await purgeShopData(shop);
      return ok(200);
    }

    if (topic === "customers/data_request") {
      console.log("GDPR customers/data_request", { shop, payload: json });
      return ok(200);
    }

    if (topic === "customers/redact") {
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

      console.log("GDPR customers/redact", { shop });
      return ok(200);
    }

    if (topic === "shop/redact") {
      console.log("GDPR shop/redact", { shop });
      await purgeShopData(shop);
      return ok(200);
    }

    console.log("Webhook topic ignored:", topic, "shop:", shop);
    return ok(200);
  } catch (err) {
    console.error("Webhook handler error", err);
    return ok(200);
  }
}