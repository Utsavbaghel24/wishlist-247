// app/routes/auth.$.jsx

import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { registerRequiredWebhooks } from "../utils/register-webhooks.server";

export const loader = async ({ request }) => {
  // 1) Finish Shopify OAuth + create session
  await authenticate.admin(request);

  // 2) Register required webhooks (APP_UNINSTALLED, etc.)
  await registerRequiredWebhooks(request);

  // 3) Redirect into the embedded app (KEEP host + shop)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  return redirect(`/app?shop=${shop}&host=${host}`);
};

export const headers = (headersArgs) => boundary.headers(headersArgs);