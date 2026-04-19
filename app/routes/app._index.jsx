import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  List,
  Badge,
  Divider,
} from "@shopify/polaris";

export default function AppIndex() {
  return (
    <Page title="Wishlist247">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">

            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  Wishlist247
                </Text>

                <Badge tone="success">Active</Badge>

                <Text as="p" variant="bodyMd">
                  Wishlist247 is a simple and elegant wishlist solution designed
                  specifically for Shopify stores. It allows customers to save
                  products, view them later, and easily move them to cart.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Features
                </Text>

                <List type="bullet">
                  <List.Item>
                    Add to wishlist button on product pages
                  </List.Item>
                  <List.Item>
                    Floating wishlist icon with live counter
                  </List.Item>
                  <List.Item>
                    Dedicated wishlist page
                  </List.Item>
                  <List.Item>
                    Remove items from wishlist
                  </List.Item>
                  <List.Item>
                    Add wishlist items directly to cart
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Important Setup
                </Text>

                <Text as="p">
                  You must create a Shopify page with the handle:
                </Text>

                <Text as="p" fontWeight="bold">
                  /wishlist
                </Text>

                <Text as="p">
                  And assign the Wishlist template provided by the app.
                </Text>

                <Divider />

                <Text as="p" tone="subdued">
                  This page is used for viewing saved items, removing products,
                  and adding them to cart.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  How it works
                </Text>

                <List type="number">
                  <List.Item>
                    Customer clicks "Add to Wishlist" on product page
                  </List.Item>
                  <List.Item>
                    Product is saved and counter updates
                  </List.Item>
                  <List.Item>
                    Customer visits wishlist page
                  </List.Item>
                  <List.Item>
                    Customer removes or adds items to cart
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}