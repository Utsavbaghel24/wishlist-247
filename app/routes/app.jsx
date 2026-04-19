import {
  Outlet,
  useLoaderData,
  useRouteError,
  useLocation,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate, WISHLIST_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  if (!billingDisabled) {
    const isTest =
      process.env.BILLING_TEST_MODE === "true" ||
      process.env.NODE_ENV !== "production";

    await billing.require({
      plans: [WISHLIST_PLAN],
      isTest,
      onFailure: async () => {
        throw new Response(null, {
          status: 302,
          headers: {
            Location: "/app/pricing",
          },
        });
      },
    });
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

function AppNav() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const host = params.get("host") || "";

  const withHost = (path) => {
    if (!host) return path;
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}host=${encodeURIComponent(host)}`;
  };

  return (
    <s-app-nav>
      <s-link href={withHost("/app")}>Home</s-link>
      <s-link href={withHost("/app/pricing")}>Pricing</s-link>
      <s-link href={withHost("/app/additional")}>Custom CSS</s-link>
    </s-app-nav>
  );
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <AppNav />
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};