import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

export async function loader({ request }) {
  try {
    const { admin, session, redirect } = await authenticate.admin(request);

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    const url = new URL(request.url);
    const host = url.searchParams.get("host") || "";

    if (billingDisabled) {
      return redirect(
        host ? `/app?host=${encodeURIComponent(host)}` : "/app",
        { target: "_self" },
      );
    }

    const alreadyActive = await hasActiveWishlistSubscription(admin);

    if (alreadyActive) {
      return redirect(
        host ? `/app?host=${encodeURIComponent(host)}` : "/app",
        { target: "_self" },
      );
    }

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

    if (!appUrl) {
      throw new Error("Missing SHOPIFY_APP_URL or APP_URL");
    }

    if (!session?.shop) {
      throw new Error("Missing session.shop");
    }

    const confirmationUrl = await startWishlistSubscription({
      admin,
      appUrl,
      shop: session.shop,
      host,
    });

    return redirect(confirmationUrl, { target: "_top" });
  } catch (error) {
    console.error("Billing start loader failed:", error);
    throw error;
  }
}

export default function BillingStart() {
  return null;
}