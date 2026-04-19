import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";

const GET_SHOP_AND_CSS_QUERY = `#graphql
query GetShopAndCss {
  shop {
    id
    name
    metafield(namespace: "wishlist247", key: "custom_css") {
      id
      value
    }
  }
}
`;

const SET_CUSTOM_CSS_MUTATION = `#graphql
mutation SetCustomCss($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      id
      namespace
      key
      value
    }
    userErrors {
      field
      message
    }
  }
}
`;

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const res = await admin.graphql(GET_SHOP_AND_CSS_QUERY);
  const json = await res.json();

  const shop = json?.data?.shop;

  return {
    shopId: shop?.id || "",
    shopName: shop?.name || "Your store",
    customCss: shop?.metafield?.value || "",
  };
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const customCss = String(formData.get("custom_css") || "");

  const shopRes = await admin.graphql(GET_SHOP_AND_CSS_QUERY);
  const shopJson = await shopRes.json();

  const ownerId = shopJson?.data?.shop?.id;

  if (!ownerId) {
    return {
      ok: false,
      message: "Unable to find shop ID.",
    };
  }

  const setRes = await admin.graphql(SET_CUSTOM_CSS_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId,
          namespace: "wishlist247",
          key: "custom_css",
          type: "multi_line_text_field",
          value: customCss,
        },
      ],
    },
  });

  const setJson = await setRes.json();
  const userErrors = setJson?.data?.metafieldsSet?.userErrors || [];

  if (userErrors.length) {
    return {
      ok: false,
      message: userErrors[0]?.message || "Failed to save custom CSS.",
    };
  }

  return {
    ok: true,
    message: "Custom CSS saved successfully.",
  };
}

export default function AdditionalPage() {
  const { shopName, customCss } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSaving = navigation.state === "submitting";

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          padding: "28px",
          marginBottom: "22px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#eef6ff",
            color: "#1d4ed8",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "14px",
          }}
        >
          Wishlist247 Custom CSS
        </div>

        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.2,
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Customize Wishlist247 styling
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: 0,
          }}
        >
          Use this page to customize the look of Wishlist247 on your storefront.
          You can change colors, spacing, borders, radius, typography, shadows,
          and more using CSS. This is ideal for merchants who want the wishlist
          UI to better match their brand.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.9fr)",
          gap: "22px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <Form method="post">
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor="custom_css"
                style={{
                  display: "block",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "8px",
                }}
              >
                Custom CSS
              </label>

              <p
                style={{
                  margin: "0 0 12px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                Add CSS here to override the default Wishlist247 styles. Your
                CSS will load automatically on the storefront where the app embed
                is active.
              </p>

              <textarea
                id="custom_css"
                name="custom_css"
                defaultValue={customCss}
                placeholder={`/* Example */
.wl-floating-link {
  background: #111827;
  border-radius: 24px;
}

.wl-floating-heart {
  color: #ec4899;
}

.wl-btn {
  border-radius: 999px;
}`}
                style={{
                  width: "100%",
                  minHeight: "360px",
                  resize: "vertical",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  color: "#111827",
                  background: "#fcfcfd",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {actionData?.message ? (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: actionData.ok ? "#ecfdf3" : "#fef2f2",
                  color: actionData.ok ? "#027a48" : "#b42318",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {actionData.message}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  background: "#111827",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? "Saving..." : "Save Custom CSS"}
              </button>

              <span
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Store: {shopName}
              </span>
            </div>
          </Form>
        </div>

        <div
          style={{
            display: "grid",
            gap: "22px",
            alignContent: "start",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                margin: "0 0 14px 0",
                color: "#111827",
              }}
            >
              Recommended selectors
            </h2>

            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                color: "#4b5563",
                lineHeight: 1.8,
                fontSize: "14px",
              }}
            >
              <li><code>.wl-btn</code> — product page wishlist button</li>
              <li><code>.wl-floating-link</code> — floating wishlist icon box</li>
              <li><code>.wl-floating-heart</code> — wishlist heart icon</li>
              <li><code>.wl-floating-count</code> — count badge</li>
              <li><code>.wl-toast</code> — success/error toast message</li>
            </ul>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                margin: "0 0 14px 0",
                color: "#111827",
              }}
            >
              Best practice
            </h2>

            <p
              style={{
                margin: 0,
                color: "#4b5563",
                lineHeight: 1.7,
                fontSize: "14px",
              }}
            >
              Use this area for CSS only. Avoid layout-breaking rules that hide
              wishlist controls entirely. For best results, customize color,
              border, shadow, radius, spacing, and typography to match your theme.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                margin: "0 0 14px 0",
                color: "#111827",
              }}
            >
              Example CSS
            </h2>

            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "13px",
                lineHeight: 1.65,
                color: "#374151",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
                overflowX: "auto",
              }}
            >{`.wl-floating-link {
  background: #0f172a;
  border-radius: 22px;
}

.wl-floating-heart {
  color: #f43f5e;
}

.wl-btn {
  border-color: #0f172a;
}

.wl-btn.is-active {
  background: #0f172a;
}`}</pre>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .wishlist247-grid-fallback {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}