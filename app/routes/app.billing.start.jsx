import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  if (billingDisabled) {
    throw redirect(host ? `/app?host=${encodeURIComponent(host)}` : "/app");
  }

  const alreadyActive = await hasActiveWishlistSubscription(admin);
  if (alreadyActive) {
    throw redirect(host ? `/app?host=${encodeURIComponent(host)}` : "/app");
  }

  const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing SHOPIFY_APP_URL or APP_URL");
  }

  const confirmationUrl = await startWishlistSubscription({
    admin,
    appUrl,
    shop: session.shop,
    host,
  });

  throw redirect(confirmationUrl);
}

export default function BillingStart() {
  return null;
}