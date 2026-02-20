// app/routes/app.pricing.jsx
import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  List,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";

import { WISHLIST_PLAN } from "../billing.plan";
import {
  hasActiveWishlistSubscription,
  startWishlistSubscription,
} from "../billing.server";
import { authenticate } from "../shopify.server";

/* ===============================
   LOADER (SERVER)
================================ */
export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const isActive = billingDisabled ? true : await hasActiveWishlistSubscription(admin);

  return new Response(
    JSON.stringify({
      plan: WISHLIST_PLAN,
      isActive,
      shop: session.shop,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

/* ===============================
   ACTION (SERVER)
================================ */
export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  // If billing is bypassed, do nothing
  if (billingDisabled) {
    return new Response(JSON.stringify({ ok: true, bypass: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const isActive = await hasActiveWishlistSubscription(admin);
  if (isActive) {
    return new Response(JSON.stringify({ ok: true, alreadyActive: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
  if (!appUrl) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing SHOPIFY_APP_URL (or APP_URL) in .env" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Preserve host param if present
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  const confirmationUrl = await startWishlistSubscription({
    admin,
    appUrl,
    shop: session.shop,
    host,
  });

  return new Response(JSON.stringify({ confirmationUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}

/* ===============================
   UI (CLIENT)
================================ */
export default function Pricing() {
  const { plan, isActive } = useLoaderData();
  const fetcher = useFetcher();

  // redirect top window to Shopify billing confirmation url
  useEffect(() => {
    const url = fetcher.data?.confirmationUrl;
    if (url) window.open(url, "_top");
  }, [fetcher.data]);

  return (
    <Page title="Plans" subtitle={`Activate ${plan.name} to enable wishlist for your storefront.`}>
      <Layout>
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                {plan.name}
              </Text>

              <Text as="p" variant="bodyMd">
                Add a wishlist icon in header, wishlist button on product pages, and a wishlist page.
                Works for guest + logged-in customers.
              </Text>

              <List type="bullet">
                <List.Item>Header wishlist icon</List.Item>
                <List.Item>Product page “Add to wishlist” button</List.Item>
                <List.Item>Wishlist page with add to cart + remove</List.Item>
                <List.Item>Paid stores only (billing protected)</List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card padding="500">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingLg">
                  ${plan.price}/month
                </Text>
                {isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="info">{plan.trialDays}-day trial</Badge>
                )}
              </InlineStack>

              <Text as="p" variant="bodyMd" tone="subdued">
                Cancel anytime • Shopify will ask for approval
              </Text>

              {isActive ? (
                <Button fullWidth disabled>
                  Subscription Active
                </Button>
              ) : (
                <fetcher.Form method="post">
                  <Button
                    submit
                    variant="primary"
                    fullWidth
                    loading={fetcher.state !== "idle"}
                  >
                    Start {plan.trialDays}-Day Free Trial
                  </Button>
                </fetcher.Form>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
