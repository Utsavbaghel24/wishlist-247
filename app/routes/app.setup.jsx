// app/routes/app.setup.jsx
import { Page, Layout, Card, Text, List, Banner, Divider } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function SetupPage() {
  return (
    <Page title="Setup Wishlist">
      <Layout>
        <Layout.Section>
          <Banner title="Complete setup in 2–3 minutes" status="info">
            <p>
              Follow these steps to enable the wishlist icon, product button, and wishlist page on your storefront.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card padding="500">
            <Text as="h2" variant="headingMd">Step 1 — Enable the App Embed</Text>
            <Text as="p" variant="bodyMd">
              This loads the wishlist scripts and powers the icon + button + page.
            </Text>

            <Divider />

            <List type="number">
              <List.Item>Go to <b>Online Store → Themes</b></List.Item>
              <List.Item>Click <b>Customize</b> on your active theme</List.Item>
              <List.Item>Open <b>App embeds</b></List.Item>
              <List.Item>Turn ON <b>Wishlist Embed</b></List.Item>
              <List.Item>Click <b>Save</b></List.Item>
            </List>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="500">
            <Text as="h2" variant="headingMd">Step 2 — Add blocks</Text>
            <Divider />

            <Text as="h3" variant="headingSm">A) Header icon</Text>
            <List type="number">
              <List.Item>In Theme Editor, open the <b>Header</b> section</List.Item>
              <List.Item>Click <b>Add block</b> → <b>Wishlist Header Icon</b></List.Item>
              <List.Item>Position it near icons/menu → <b>Save</b></List.Item>
            </List>

            <Divider />

            <Text as="h3" variant="headingSm">B) Product page button</Text>
            <List type="number">
              <List.Item>In Theme Editor, open a <b>Product template</b></List.Item>
              <List.Item>Click <b>Add block</b> in product info section</List.Item>
              <List.Item>Select <b>Wishlist Button</b> → position → <b>Save</b></List.Item>
            </List>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="500">
            <Text as="h2" variant="headingMd">Step 3 — Create a Wishlist page</Text>
            <Text as="p" variant="bodyMd">
              The wishlist page URL used by the app is <b>/pages/wishlist</b>.
            </Text>

            <Divider />

            <List type="number">
              <List.Item>Go to <b>Online Store → Pages</b> → <b>Add page</b></List.Item>
              <List.Item>Title: <b>Wishlist</b></List.Item>
              <List.Item>Choose a template where you can add sections</List.Item>
              <List.Item>Theme Editor → open this page → <b>Add section</b> → <b>Wishlist Page</b></List.Item>
              <List.Item><b>Save</b></List.Item>
            </List>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
