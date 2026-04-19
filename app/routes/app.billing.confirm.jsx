import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  markTrialUsed,
} from "../billing.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";
  const shop = session?.shop || url.searchParams.get("shop") || "";

  if (!shop) {
    throw redirect("/app/pricing");
  }

  const isActive = await hasActiveWishlistSubscription(admin);

  if (isActive) {
    await markTrialUsed(shop);

    const appUrl = `/app?shop=${encodeURIComponent(shop)}${
      host ? `&host=${encodeURIComponent(host)}` : ""
    }`;

    throw redirect(appUrl);
  }

  const pricingUrl = `/app/pricing?shop=${encodeURIComponent(shop)}${
    host ? `&host=${encodeURIComponent(host)}` : ""
  }`;

  throw redirect(pricingUrl);
}

export default function BillingConfirm() {
  return null;
}