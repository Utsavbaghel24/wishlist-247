// app/utils/webhook-verify.server.js
import crypto from "crypto";

export function verifyShopifyWebhook(request, rawBody) {
    const hmacHeader =
        request.headers.get("x-shopify-hmac-sha256") ||
        request.headers.get("X-Shopify-Hmac-Sha256");

    if (!hmacHeader) return false;

    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) return false;

    const digest = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("base64");

    // Timing safe compare
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(String(hmacHeader), "utf8");
    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
}