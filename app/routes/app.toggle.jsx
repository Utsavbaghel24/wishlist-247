import {
  Page,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Button,
  Badge,
} from "@shopify/polaris";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * We store the toggle in currentAppInstallation metafield:
 * namespace: wishlist247
 * key: enabled
 * type: boolean
 */

const GET_ENABLED_QUERY = `#graphql
query GetEnabled {
  currentAppInstallation {
    id
    metafield(namespace: "wishlist247", key: "enabled") {
      id
      type
      value
    }
  }
}
`;

const SET_ENABLED_MUTATION = `#graphql
mutation SetEnabled($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key type value }
    userErrors { field message }
  }
}
`;

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const res = await admin.graphql(GET_ENABLED_QUERY);
  const data = await res.json();

  const value = data?.data?.currentAppInstallation?.metafield?.value;
  const enabled = value === null || value === undefined ? true : value === "true";

  return { enabled };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();

  const enabled = form.get("enabled") === "true";

  const getRes = await admin.graphql(`#graphql
    query GetInstallId {
      currentAppInstallation { id }
    }
  `);
  const getJson = await getRes.json();
  const ownerId = getJson?.data?.currentAppInstallation?.id;

  const setRes = await admin.graphql(SET_ENABLED_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId,
          namespace: "wishlist247",
          key: "enabled",
          type: "boolean",
          value: enabled ? "true" : "false",
        },
      ],
    },
  });

  const setJson = await setRes.json();
  const err = setJson?.data?.metafieldsSet?.userErrors?.[0]?.message;

  if (err) {
    return { ok: false, message: err, enabled };
  }

  return { ok: true, enabled };
};

export default function TogglePage() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();

  const currentEnabled =
    fetcher.data?.enabled !== undefined ? fetcher.data.enabled : loaderData.enabled;

  const isSaving = fetcher.state === "submitting";

  return (
    <Page title="Enable / Disable Wishlist">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="h2" variant="headingMd">
                Wishlist Status
              </Text>

              <Badge tone={currentEnabled ? "success" : "critical"}>
                {currentEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </InlineStack>

            <Text as="p" variant="bodyMd">
              This is the master switch. If disabled, your storefront wishlist icon,
              button, and page should not load.
            </Text>

            <InlineStack gap="300" align="start">
              <Button
                loading={isSaving}
                tone={currentEnabled ? "critical" : "success"}
                onClick={() => {
                  const fd = new FormData();
                  fd.append("enabled", currentEnabled ? "false" : "true");
                  fetcher.submit(fd, { method: "POST" });
                }}
              >
                {currentEnabled ? "Turn OFF Wishlist" : "Turn ON Wishlist"}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}