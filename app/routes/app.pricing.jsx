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

import { authenticate } from "../shopify.server";
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
  const { billing, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  const isTest = process.env.NODE_ENV !== "production";

  let isActive = false;
  let subscriptions = [];

  if (billingDisabled) {
    isActive = true;
  } else {
    const billingStatus = await billing.check({
      plans: [WISHLIST_PLAN],
      isTest,
    });

    isActive = billingStatus.hasActivePayment;
    subscriptions = billingStatus.appSubscriptions || [];
  }

  return json({
    plan: WISHLIST_PLAN,
    isActive,
    subscriptions,
    shop: session.shop,
  });
}

export async function action({ request }) {
  const { billing } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  if (billingDisabled) {
    return json({ ok: true, bypass: true });
  }

  const isTest = process.env.NODE_ENV !== "production";

  const billingStatus = await billing.check({
    plans: [WISHLIST_PLAN],
    isTest,
  });

  if (billingStatus.hasActivePayment) {
    return json({ ok: true, alreadyActive: true });
  }

  const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;

  if (!appUrl) {
    return json(
      { ok: false, error: "Missing SHOPIFY_APP_URL or APP_URL" },
      { status: 500 },
    );
  }

  return billing.request({
    plan: WISHLIST_PLAN,
    isTest,
    trialDays: WISHLIST_PLAN.trialDays,
    returnUrl: `${appUrl}/app/billing/confirm`,
  });
}

export default function Pricing() {
  const data = useLoaderData();

  const plan = data?.plan || WISHLIST_PLAN;
  const isActive = !!data?.isActive;

  return (
    <Page
      title="Pricing"
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
                Wishlist247 gives your store a clean, professional wishlist system
                with a product page wishlist button, a floating wishlist icon,
                and a dedicated wishlist page with add-to-cart and remove actions.
              </Text>

              <List type="bullet">
                <List.Item>Wishlist button on product pages</List.Item>
                <List.Item>Floating wishlist icon with live count</List.Item>
                <List.Item>Dedicated wishlist page</List.Item>
                <List.Item>Remove items from wishlist</List.Item>
                <List.Item>Add wishlist items directly to cart</List.Item>
                <List.Item>Billing-protected access for active merchants</List.Item>
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
                7-day free trial, then ${plan.price}/month. Cancel anytime.
              </Text>

              {isActive ? (
                <Button fullWidth disabled>
                  Subscription Active
                </Button>
              ) : (
                <Form method="post" reloadDocument>
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