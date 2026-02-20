// app/routes/app._index.jsx
import { useLocation, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  List,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppIndex() {
  const location = useLocation();
  const navigate = useNavigate();
  const qs = location.search || "";

  const go = (path) => navigate(`${path}${qs}`);

  return (
    <Page
      title="Wishlist-247"
      subtitle="Manage your paid wishlist app and storefront setup."
      primaryAction={{ content: "Open Settings", onAction: () => go("/app/settings") }}
      secondaryActions={[
        { content: "Plans", onAction: () => go("/app/pricing") },
        { content: "Help", onAction: () => go("/app/help") },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Status
                </Text>
                <Badge tone="success">Connected</Badge>
              </InlineStack>

              <Text as="p" variant="bodyMd">
                Your embedded app is working. Next: enable the wishlist embed + blocks in your theme.
              </Text>

              <InlineStack gap="200">
                <Button variant="primary" onClick={() => go("/app/setup")}>
                  Setup Guide
                </Button>
                <Button onClick={() => go("/app/settings")}>Settings</Button>
                <Button onClick={() => go("/app/pricing")}>Plans</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Storefront checklist
              </Text>

              <List type="number">
                <List.Item>Enable <b>Wishlist Embed</b> in Theme → App embeds</List.Item>
                <List.Item>Add <b>Wishlist Header Icon</b> block in Header</List.Item>
                <List.Item>Add <b>Wishlist Button</b> block on Product template</List.Item>
                <List.Item>Create page <b>/pages/wishlist</b> and add <b>Wishlist Page</b> section</List.Item>
              </List>

              <InlineStack gap="200">
                <Button onClick={() => go("/app/setup")}>View setup steps</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
