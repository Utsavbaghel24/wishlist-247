import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import {
  hasActiveWishlistSubscription,
  cancelWishlistSubscription,
  getOrCreateShop,
} from "../billing.server";
import { WISHLIST_PLAN } from "../billing.plan";

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  const isActive = await hasActiveWishlistSubscription(admin);
  const shopRecord = await getOrCreateShop(session.shop);

  return json({
    plan: WISHLIST_PLAN,
    isActive,
    shop: session.shop,
    host,
    trialUsed: !!shopRecord?.trialUsed,
  });
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "cancel_subscription") {
    await cancelWishlistSubscription(admin);
    return json({ ok: true, cancelled: true });
  }

  return json({ ok: false }, { status: 400 });
}

export default function Pricing() {
  const data = useLoaderData();
  const fetcher = useFetcher();

  const plan = data.plan;
  const isActive = data.isActive;
  const trialUsed = data.trialUsed;
  const host = data.host;
  const shop = data.shop;

  const billingUrl = `/app/billing/start?shop=${encodeURIComponent(
    shop,
  )}&host=${encodeURIComponent(host)}`;

  const isCancelling =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "cancel_subscription";

  return (
    <div style={{ padding: 40 }}>
      <h2>Wishlist Pricing</h2>

      <h3>
        ${plan.price} / month
      </h3>

      <p>
        {trialUsed
          ? "Trial already used. Subscribe now."
          : `${plan.trialDays}-day free trial`}
      </p>

      {isActive ? (
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="cancel_subscription" />
          <button type="submit" disabled={isCancelling}>
            {isCancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </fetcher.Form>
      ) : (
        <a href={billingUrl} target="_top">
          {trialUsed ? "Subscribe Now" : "Start 7 Day Free Trial"}
        </a>
      )}
    </div>
  );
}