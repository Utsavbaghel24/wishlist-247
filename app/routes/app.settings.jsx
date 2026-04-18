// app/routes/app.settings.jsx

import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  Checkbox,
} from "@shopify/polaris";

import prisma from "../db.server.js";
import { authenticate } from "../shopify.server";
import { WISHLIST_PLAN } from "../billing.plan";
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function loader({ request }) {
  const { billing, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  let billingActive = false;

  if (billingDisabled) {
    billingActive = true;
  } else {
    const billingStatus = await billing.check({
      plans: [WISHLIST_PLAN],
      isTest: true,
    });

    billingActive = billingStatus.hasActivePayment;
  }

  const setting = await prisma.wishlistSetting.upsert({
    where: { shop: session.shop },
    update: {},
    create: { shop: session.shop, enabled: true },
  });

  return json({
    shop: session.shop,
    enabled: !!setting.enabled,
    billingActive: !!billingActive,
  });
}

export async function action({ request }) {
  const { billing, session } = await authenticate.admin(request);

  const billingDisabled =
    process.env.BILLING_DISABLED === "true" ||
    process.env.BYPASS_BILLING === "1";

  let billingActive = false;

  if (billingDisabled) {
    billingActive = true;
  } else {
    const billingStatus = await billing.check({
      plans: [WISHLIST_PLAN],
      isTest: true,
    });

    billingActive = billingStatus.hasActivePayment;
  }

  if (!billingActive) {
    return json({ ok: false, billingRequired: true }, 402);
  }

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

  useEffect(() => {
    setEnabled(data.enabled);
  }, [data.enabled]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      setEnabled(fetcher.data.enabled);
    }
  }, [fetcher.data]);

  const saving = fetcher.state !== "idle";
  const statusText = data.billingActive
    ? enabled
      ? "Enabled"
      : "Disabled"
    : "Plan required";

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
                <Text as="h2" variant="headingMd">
                  Storefront Status
                </Text>

                <Text
                  as="p"
                  variant="bodyMd"
                  tone={
                    !data.billingActive
                      ? "subdued"
                      : enabled
                        ? "success"
                        : "subdued"
                  }
                >
                  {statusText}
                </Text>
              </InlineStack>

              <Checkbox
                label="Enable Wishlist on storefront"
                checked={enabled}
                disabled={!data.billingActive}
                onChange={(value) => setEnabled(value)}
              />

              <fetcher.Form method="post">
                <input type="hidden" name="enabled" value={String(enabled)} />
                <Button
                  submit
                  variant="primary"
                  disabled={!data.billingActive}
                  loading={saving}
                >
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