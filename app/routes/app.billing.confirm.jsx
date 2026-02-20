// app/routes/app.billing.confirm.jsx
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

import { Page, Layout, Card, Text, Button, BlockStack, Banner } from "@shopify/polaris";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const isActive = await hasActiveWishlistSubscription(admin);
  if (isActive) throw redirect("/app");

  return {
    ok: false,
    message:
      "Subscription not active. You may have cancelled approval or the store has no payment method. Please try again.",
  };
}

export default function BillingConfirm() {
  const data = useLoaderData();

  return (
    <Page title="Billing status">
      <Layout>
        <Layout.Section>
          <Banner tone="warning" title="Billing not approved">
            <p>{data?.message}</p>
          </Banner>

          <Card padding="600">
            <BlockStack gap="300">
              <Text as="p" tone="subdued">
                Go back to pricing and start the trial again to enable the app.
              </Text>

              <Button url="/app/pricing" variant="primary">
                Back to Pricing
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
