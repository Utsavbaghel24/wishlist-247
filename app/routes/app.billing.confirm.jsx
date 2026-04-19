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

  const isActive = await hasActiveWishlistSubscription(admin);

  if (isActive) {
    await markTrialUsed(session.shop);

    return redirect(`/app?host=${encodeURIComponent(host)}`);
  }

  return redirect(`/app/pricing?host=${encodeURIComponent(host)}`);
}

export default function BillingConfirm() {
  return null;
}