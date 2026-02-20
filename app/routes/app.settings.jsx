// app/routes/app.settings.jsx
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Page, Layout, Card, Text, Button, BlockStack, InlineStack, Banner, Checkbox } from "@shopify/polaris";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { hasActiveWishlistSubscription } from "../billing.server";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" || process.env.BYPASS_BILLING === "1";

  const isActive = billingDisabled ? true : await hasActiveWishlistSubscription(admin);

  const setting = await prisma.wishlistSetting.upsert({
    where: { shop: session.shop },
    update: {},
    create: { shop: session.shop, enabled: true },
  });

  return json({
    shop: session.shop,
    enabled: !!setting.enabled,
    billingActive: !!isActive,
  });
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" || process.env.BYPASS_BILLING === "1";

  const isActive = billingDisabled ? true : await hasActiveWishlistSubscription(admin);
  if (!isActive) return json({ ok: false, billingRequired: true }, 402);

  const form = await request.formData();
  const enabled = form.get("enabled") === "true";

  await prisma.wishlistSetting.upsert({
    where: { shop: session.shop },
    update: { enabled },
    create: { shop: session.shop, enabled },
  });

  return json({ ok: true, enabled });
}

export default function Settings() {
  const data = useLoaderData();
  const fetcher = useFetcher();
  const [enabled, setEnabled] = useState(data.enabled);

  useEffect(() => setEnabled(data.enabled), [data.enabled]);

  const saving = fetcher.state !== "idle";

  return (
    <Page title="Settings" subtitle="Turn wishlist ON/OFF for your storefront.">
      <Layout>
        <Layout.Section>
          {!data.billingActive ? (
            <Banner tone="warning" title="Plan not active">
              <p>Activate a plan in Plans to enable wishlist on the storefront.</p>
            </Banner>
          ) : null}

          <Card padding="500">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">Storefront Status</Text>
                <Text as="p" variant="bodyMd" tone={enabled ? "success" : "subdued"}>
                  {enabled ? "Enabled" : "Disabled"}
                </Text>
              </InlineStack>

              <Checkbox
                label="Enable Wishlist on storefront"
                checked={enabled}
                disabled={!data.billingActive}
                onChange={(v) => setEnabled(v)}
              />

              <fetcher.Form method="post">
                <input type="hidden" name="enabled" value={String(enabled)} />
                <Button submit variant="primary" disabled={!data.billingActive} loading={saving}>
                  Save
                </Button>
              </fetcher.Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
