// app/routes/proxy.jsx
import { authenticate } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  try {
    // ✅ BILLING GATE
    const { admin } = await authenticate.public(request);
    const isActive = await hasActiveWishlistSubscription(admin);

    if (!isActive) {
      return json(
        {
          ok: false,
          billingRequired: true,
          error: "Billing required. Please activate your plan in the app.",
        },
        402
      );
    }

    return json({ ok: true, message: "Proxy working" });
  } catch (e) {
    return json({ ok: false, error: e?.message || "Server error" }, 500);
  }
}
