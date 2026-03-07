// app/utils/webhook-verify.server.js
import crypto from "crypto";

export function verifyShopifyWebhook(request, rawBody) {
    const hmacHeader =
        request.headers.get("x-shopify-hmac-sha256") ||
        request.headers.get("X-Shopify-Hmac-Sha256");

    if (!hmacHeader || !rawBody) return false;

    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
        console.error("Missing SHOPIFY_API_SECRET");
        return false;
    }

    const digest = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("base64");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(digest, "utf8"),
            Buffer.from(String(hmacHeader), "utf8"),
        );
    } catch {
        return false;
    }
}