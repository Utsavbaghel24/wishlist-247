import { Outlet, useLoaderData, useRouteError, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
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