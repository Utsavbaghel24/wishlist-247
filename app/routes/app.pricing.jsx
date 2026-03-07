// app/routes/app.pricing.jsx
import { Form, useLoaderData } from "react-router";
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

import { authenticate, WISHLIST_PLAN } from "../shopify.server";

const PLAN = {
  name: "Wishlist Pro",
  price: 0,
  trialDays: 7,
};

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
  try {
    const { billing, session } = await authenticate.admin(request);

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    let isActive = false;
    let subscriptions = [];

    if (billingDisabled) {
      isActive = true;
    } else {
      const billingStatus = await billing.check({
        plans: [WISHLIST_PLAN],
        isTest: true,
      });

      isActive = billingStatus.hasActivePayment;
      subscriptions = billingStatus.appSubscriptions || [];
    }

    return json({
      plan: PLAN,
      isActive,
      subscriptions,
      shop: session.shop,
    });
  } catch (error) {
    console.error("APP PRICING LOADER ERROR:");
    console.error(error);
    return json(
      {
        ok: false,
        error: error?.message || "Pricing loader failed",
      },
      { status: 500 },
    );
  }
}

export async function action({ request }) {
  try {
    console.log("=== BILLING ACTION START ===");

    const { billing, session } = await authenticate.admin(request);
    console.log("Authenticated shop:", session?.shop);

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    console.log("billingDisabled:", billingDisabled);
    console.log("WISHLIST_PLAN:", WISHLIST_PLAN);

    if (billingDisabled) {
      return json({ ok: true, bypass: true });
    }

    const billingStatus = await billing.check({
      plans: [WISHLIST_PLAN],
      isTest: true,
    });

    console.log("billingStatus.hasActivePayment:", billingStatus?.hasActivePayment);
    console.log("billingStatus.appSubscriptions:", billingStatus?.appSubscriptions);

    if (billingStatus.hasActivePayment) {
      return json({ ok: true, alreadyActive: true });
    }

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
    console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL);
    console.log("APP_URL:", process.env.APP_URL);
    console.log("resolved appUrl:", appUrl);

    if (!appUrl) {
      throw new Error("Missing SHOPIFY_APP_URL or APP_URL");
    }

    const returnUrl = `${appUrl}/app/settings`;
    console.log("returnUrl:", returnUrl);

    console.log("About to call billing.request...");

    return await billing.request({
      plan: WISHLIST_PLAN,
      isTest: true,
      trialDays: PLAN.trialDays,
      returnUrl,
    });
  } catch (error) {
    console.error("=== BILLING ACTION ERROR ===");
    console.error(error);

    return json(
      {
        ok: false,
        error: error?.message || "Billing action failed",
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export default function Pricing() {
  const data = useLoaderData();

  const plan = data?.plan || PLAN;
  const isActive = !!data?.isActive;

  return (
    <Page
      title="Plans"
      subtitle={`Activate ${plan.name} to enable wishlist for your storefront.`}
    >
      <Layout>
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                {plan.name}
              </Text>

              <Text as="p" variant="bodyMd">
                Add a wishlist icon in header, wishlist button on product pages, and a wishlist
                page. Works for guest + logged-in customers.
              </Text>

              <List type="bullet">
                <List.Item>Header wishlist icon</List.Item>
                <List.Item>Product page Add to wishlist button</List.Item>
                <List.Item>Wishlist page with add to cart + remove</List.Item>
                <List.Item>Paid stores only billing protected</List.Item>
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
                <Form method="post">
                  <Button submit variant="primary" fullWidth>
                    Start {plan.trialDays}-Day Free Trial
                  </Button>
                </Form>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}