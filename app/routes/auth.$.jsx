// app/routes/auth.$.jsx
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { registerRequiredWebhooks } from "../utils/register-webhooks.server";

export const loader = async ({ request }) => {
  // 1) Finish Shopify OAuth + create session
  await authenticate.admin(request);

  // 2) Register required webhooks (APP_UNINSTALLED, etc.)
  await registerRequiredWebhooks(request);

  // 3) Redirect into the embedded app
  return new Response(null, {
    status: 302,
    headers: { Location: "/app" },
  });
};

export const headers = (headersArgs) => boundary.headers(headersArgs);