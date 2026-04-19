export default function AppIndex() {
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
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "20px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#ecfdf3",
            color: "#027a48",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "14px",
          }}
        >
          Wishlist247 is Active
        </div>

        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.2,
            margin: "0 0 12px 0",
            color: "#111827",
          }}
        >
          Welcome to Wishlist247
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#4b5563",
            margin: 0,
          }}
        >
          Wishlist247 is a simple and product-focused wishlist app for Shopify
          stores. It allows customers to save products from product pages, view
          them later on a dedicated wishlist page, remove items easily, and add
          saved products to cart in a smooth and clean experience.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
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
            What the app does
          </h2>

          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#4b5563",
              lineHeight: 1.8,
              fontSize: "15px",
            }}
          >
            <li>Add to Wishlist button on product pages</li>
            <li>Floating wishlist icon with live count</li>
            <li>Dedicated wishlist page for saved products</li>
            <li>Remove items from wishlist</li>
            <li>Add wishlist items directly to cart</li>
          </ul>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
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
            Mandatory setup
          </h2>

          <p
            style={{
              margin: "0 0 12px 0",
              color: "#4b5563",
              lineHeight: 1.7,
              fontSize: "15px",
            }}
          >
            You must create a Shopify page with the handle:
          </p>

          <div
            style={{
              display: "inline-block",
              background: "#111827",
              color: "#ffffff",
              borderRadius: "10px",
              padding: "10px 14px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            /wishlist
          </div>

          <p
            style={{
              margin: 0,
              color: "#4b5563",
              lineHeight: 1.7,
              fontSize: "15px",
            }}
          >
            Assign the special Wishlist template to that page. This page is used
            for viewing saved items, removing products, and adding them to cart.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
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
            Customer journey
          </h2>

          <ol
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#4b5563",
              lineHeight: 1.8,
              fontSize: "15px",
            }}
          >
            <li>Customer opens a product page</li>
            <li>Clicks Add to Wishlist</li>
            <li>Floating icon updates automatically</li>
            <li>Customer visits /wishlist page</li>
            <li>Customer removes items or adds them to cart</li>
          </ol>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
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
            Recommended page details
          </h2>

          <div style={{ color: "#4b5563", lineHeight: 1.8, fontSize: "15px" }}>
            <div>
              <strong style={{ color: "#111827" }}>Page title:</strong> My
              Wishlist
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Handle:</strong> wishlist
            </div>
            <div>
              <strong style={{ color: "#111827" }}>Purpose:</strong> View saved
              items, remove products, and add them to cart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}