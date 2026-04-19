import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Badge,
  List,
  Box,
  Divider,
  Link,
} from "@shopify/polaris";

export default function AppIndex() {
  return (
    <Page
      title="Wishlist247"
      subtitle="A clean, product-focused wishlist experience for Shopify stores."
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card roundedAbove="sm">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">
                      Welcome to Wishlist247
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Wishlist247 is designed to help merchants offer a simple,
                      elegant, and reliable wishlist experience on their Shopify
                      storefront. Customers can add products to their wishlist
                      directly from product pages, review saved items on a
                      dedicated wishlist page, remove products anytime, and move
                      products to cart with ease.
                    </Text>
                  </BlockStack>

                  <Badge tone="success">Live & Working</Badge>
                </InlineStack>

                <Divider />

                <BlockStack gap="250">
                  <Text as="h3" variant="headingMd">
                    What Wishlist247 does
                  </Text>

                  <List type="bullet">
                    <List.Item>
                      Adds a wishlist button on <strong>product pages</strong>.
                    </List.Item>
                    <List.Item>
                      Displays a floating wishlist icon with a live item count.
                    </List.Item>
                    <List.Item>
                      Creates a dedicated wishlist page where customers can view
                      all saved products.
                    </List.Item>
                    <List.Item>
                      Lets customers remove products from wishlist easily.
                    </List.Item>
                    <List.Item>
                      Supports moving wishlist items to cart from the wishlist
                      page.
                    </List.Item>
                    <List.Item>
                      Works with a clean and lightweight setup designed to stay
                      simple, fast, and storefront-friendly.
                    </List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>

            <Layout>
              <Layout.Section oneHalf>
                <Card roundedAbove="sm">
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Important setup requirement
                    </Text>

                    <Text as="p" variant="bodyMd">
                      Wishlist247 requires a dedicated Shopify page for the
                      wishlist experience.
                    </Text>

                    <Box
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Mandatory page setup
                        </Text>

                        <List type="bullet">
                          <List.Item>
                            Create a Shopify page with the handle{" "}
                            <strong>/wishlist</strong>.
                          </List.Item>
                          <List.Item>
                            Use the dedicated <strong>wishlist page template</strong>{" "}
                            created for Wishlist247.
                          </List.Item>
                          <List.Item>
                            Keep the handle exactly as <strong>wishlist</strong>{" "}
                            so the app button and floating icon always point to
                            the correct page.
                          </List.Item>
                        </List>
                      </BlockStack>
                    </Box>

                    <Text as="p" variant="bodyMd" tone="subdued">
                      Without this page, customers will still be able to add
                      items, but they will not have the intended branded wishlist
                      experience for viewing, removing, and adding products to
                      cart from one place.
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section oneHalf>
                <Card roundedAbove="sm">
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Recommended merchant flow
                    </Text>

                    <List type="number">
                      <List.Item>Install Wishlist247.</List.Item>
                      <List.Item>
                        Enable the wishlist app embed and product page block.
                      </List.Item>
                      <List.Item>
                        Create a page named <strong>My Wishlist</strong>.
                      </List.Item>
                      <List.Item>
                        Set the page handle to <strong>/wishlist</strong>.
                      </List.Item>
                      <List.Item>
                        Assign the dedicated wishlist template.
                      </List.Item>
                      <List.Item>
                        Save and test from the storefront product page.
                      </List.Item>
                    </List>

                    <Text as="p" variant="bodyMd" tone="subdued">
                      Wishlist247 is specially designed to keep the experience
                      clean, intuitive, and conversion-friendly without adding
                      unnecessary complexity to the storefront.
                    </Text>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>

            <Card roundedAbove="sm">
              <BlockStack gap="350">
                <Text as="h3" variant="headingMd">
                  Customer experience
                </Text>

                <Text as="p" variant="bodyMd">
                  Customers interact with Wishlist247 in a very simple way:
                </Text>

                <List type="bullet">
                  <List.Item>
                    On the <strong>product page</strong>, they click{" "}
                    <strong>Add to Wishlist</strong>.
                  </List.Item>
                  <List.Item>
                    The floating wishlist icon updates with the saved item count.
                  </List.Item>
                  <List.Item>
                    On the <strong>/wishlist</strong> page, they can review
                    saved products in one place.
                  </List.Item>
                  <List.Item>
                    They can remove unwanted items.
                  </List.Item>
                  <List.Item>
                    They can add selected wishlist products directly to cart.
                  </List.Item>
                </List>

                <Text as="p" variant="bodyMd" tone="subdued">
                  This creates a polished saved-items flow that feels natural for
                  shoppers and useful for merchants.
                </Text>
              </BlockStack>
            </Card>

            <Card roundedAbove="sm">
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Notes for merchants
                </Text>

                <List type="bullet">
                  <List.Item>
                    The wishlist button is intended for <strong>product pages</strong>.
                  </List.Item>
                  <List.Item>
                    The wishlist page should be published and accessible to
                    storefront visitors.
                  </List.Item>
                  <List.Item>
                    The page handle should remain <strong>/wishlist</strong>.
                  </List.Item>
                  <List.Item>
                    For the best experience, use the dedicated Wishlist247
                    template created for this app.
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card roundedAbove="sm">
              <BlockStack gap="250">
                <Text as="h3" variant="headingMd">
                  Suggested page title and meta description
                </Text>

                <Box
                  padding="300"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      <strong>Page title:</strong> My Wishlist
                    </Text>
                    <Text as="p" variant="bodyMd">
                      <strong>Meta description:</strong> View your saved products,
                      manage your wishlist, remove items, and add your favorite
                      picks to cart from one dedicated page.
                    </Text>
                    <Text as="p" variant="bodyMd">
                      <strong>URL handle:</strong> /wishlist
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>

            <Card roundedAbove="sm">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Support
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  If the wishlist page is not showing correctly, first confirm
                  that the page exists, the handle is set to{" "}
                  <strong>/wishlist</strong>, and the dedicated template has been
                  assigned correctly.
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}