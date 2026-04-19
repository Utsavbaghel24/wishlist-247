import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session, redirect } = await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  if (!session?.shop) {
    throw new Error("Missing shop");
  }

  const isActive = await hasActiveWishlistSubscription(admin);

  if (isActive) {
    return redirect(`/app?host=${encodeURIComponent(host)}`, {
      target: "_top",
    });
  }

  const appUrl = process.env.SHOPIFY_APP_URL;

  const confirmationUrl = await startWishlistSubscription({
    admin,
    shop: session.shop,
    host,
    appUrl,
  });

  return redirect(confirmationUrl, { target: "_top" });
}

export default function BillingStart() {
  return null;
}