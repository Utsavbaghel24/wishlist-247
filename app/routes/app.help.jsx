import { Page, Card, BlockStack, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function HelpPage() {
  return (
    <Page title="Help" subtitle="Quick troubleshooting and support.">
      <Card padding="500">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">Need help?</Text>
          <Text as="p" variant="bodyMd">
            If the wishlist icon/button/page isn’t showing: make sure App Embed is ON and blocks/section are added in Theme Editor, then Save.
          </Text>
          <Text as="p" variant="bodyMd">
            Reach out to us at <b>abc@gmail.com</b> — we will reach out to you.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
