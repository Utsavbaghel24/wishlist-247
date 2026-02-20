// app/routes/auth.login.jsx
import {
  Page,
  Card,
  TextField,
  Button,
  Form,
  FormLayout,
  Text,
} from "@shopify/polaris";
import { useState } from "react";
import { redirect } from "react-router";

// Decode host (base64) → "shop.myshopify.com/admin"
function shopFromHost(host) {
  try {
    const decoded = Buffer.from(host, "base64").toString("utf8");
    const shop = decoded.split("/")[0];
    return shop || null;
  } catch (e) {
    return null;
  }
}

export async function loader({ request }) {
  const url = new URL(request.url);

  // 1) If shop present, redirect immediately
  const shop = url.searchParams.get("shop");
  if (shop) {
    throw redirect(`/auth?shop=${encodeURIComponent(shop)}`);
  }

  // 2) If shop missing but host present, extract shop from host and redirect
  const host = url.searchParams.get("host");
  if (host) {
    const shopFromH = shopFromHost(host);
    if (shopFromH) {
      throw redirect(`/auth?shop=${encodeURIComponent(shopFromH)}`);
    }
  }

  // Otherwise show manual login form
  return null;
}

export async function action({ request }) {
  const form = await request.formData();
  const shop = String(form.get("shop") || "").trim();
  if (!shop) return null;

  throw redirect(`/auth?shop=${encodeURIComponent(shop)}`);
}

export default function AuthLogin() {
  const [shop, setShop] = useState("utsav247.myshopify.com");

  return (
    <Page title="Log in">
      <Card sectioned>
        <Text as="p" variant="bodyMd">
          Enter your shop domain to continue.
        </Text>

        <Form method="post">
          <FormLayout>
            <TextField
              label="Shop domain"
              value={shop}
              onChange={setShop}
              placeholder="example.myshopify.com"
              autoComplete="off"
              name="shop"
            />
            <Button submit primary>
              Log in
            </Button>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
}
