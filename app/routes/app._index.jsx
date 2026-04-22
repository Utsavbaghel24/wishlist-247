export default function AppIndex() {
  const steps = [
    "Go to Online Store → Themes",
    "Click Customize on your active theme",
    "Open a Product page template",
    "Add the Wishlist Button app block",
    "Save the theme changes",
    "Create a page with handle wishlist and assign the Wishlist page template",
  ];

  const features = [
    "Add to Wishlist button on product pages",
    "Floating wishlist icon with live count",
    "Dedicated wishlist page for saved items",
    "Remove saved products anytime",
    "Add wishlist items directly to cart",
  ];

  const notes = [
    "Works best with Online Store 2.0 themes",
    "App blocks can be added, removed, and repositioned from the theme editor",
    "If your theme does not support app blocks, use a supported theme before setup",
    "Make sure the wishlist page handle is exactly wishlist",
  ];

  return (
    <div style={styles.page}>
      <style>{responsiveCss}</style>

      <div style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.badge}>Wishlist247 is Active</div>

          <div className="hero-grid" style={styles.heroGrid}>
            <div>
              <h1 style={styles.heroTitle}>Welcome to Wishlist247</h1>
              <p style={styles.heroText}>
                Wishlist247 helps your customers save products, revisit them later,
                and add them to cart from a clean, dedicated wishlist experience.
                This page gives you the exact setup steps needed to get the app
                live on your storefront quickly and correctly.
              </p>

              <div style={styles.tagWrap}>
                <span style={styles.tag}>Product Page Button</span>
                <span style={styles.tag}>Floating Wishlist Icon</span>
                <span style={styles.tag}>Dedicated Wishlist Page</span>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Quick Setup Summary</div>

              <div style={styles.summaryList}>
                <div>1. Add the Wishlist Button app block on product pages.</div>
                <div>2. Create the wishlist page and assign the correct template.</div>
                <div>3. Save and preview your storefront.</div>
              </div>

              <div style={styles.handleBox}>
                <span>Required page handle:</span>
                <span style={styles.handlePill}>/wishlist</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid-three" style={styles.gridThree}>
          <section style={{ ...styles.card, gridColumn: "span 2" }}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, background: "#f3e8ff", color: "#7c3aed" }}>
                ♡
              </div>
              <div>
                <h2 style={styles.cardTitle}>What the app does</h2>
                <p style={styles.cardSubtext}>
                  Core storefront functionality available after setup
                </p>
              </div>
            </div>

            <div className="feature-grid" style={styles.featureGrid}>
              {features.map((item) => (
                <div key={item} style={styles.featureItem}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, background: "#dcfce7", color: "#15803d" }}>
                ✓
              </div>
              <div>
                <h2 style={styles.cardTitle}>Store requirements</h2>
                <p style={styles.cardSubtext}>Setup details to complete before launch</p>
              </div>
            </div>

            <div style={styles.infoStack}>
              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Required page handle</div>
                <div style={styles.darkPill}>wishlist</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Page title</div>
                <div style={styles.infoValue}>My Wishlist</div>
              </div>

              <div style={styles.infoBox}>
                <div style={styles.infoLabel}>Assign template</div>
                <div style={styles.infoValue}>
                  Use the Wishlist page template for the page with handle{" "}
                  <strong>wishlist</strong>.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid-two" style={styles.gridTwo}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconBox, background: "#dbeafe", color: "#2563eb" }}>
                ⏱
              </div>
              <div>
                <h2 style={styles.cardTitle}>Setup instructions</h2>
                <p style={styles.cardSubtext}>Follow these steps after installation</p>
              </div>
            </div>

            <div style={styles.stepsWrap}>
              {steps.map((step, index) => (
                <div key={step} style={styles.stepRow}>
                  <div style={styles.stepNumber}>{index + 1}</div>
                  <div style={styles.stepText}>{step}</div>
                </div>
              ))}
            </div>

            <div style={styles.warningBox}>
              <strong>Important:</strong> Add the Wishlist Button block on product
              page templates where you want customers to save products. Then create
              the wishlist page so customers can view, remove, and add saved items
              to cart.
            </div>
          </section>

          <div style={styles.sideColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconBox, background: "#fce7f3", color: "#db2777" }}>
                  ✦
                </div>
                <div>
                  <h2 style={styles.cardTitle}>Merchant notes</h2>
                  <p style={styles.cardSubtext}>
                    Helpful reminders before publishing
                  </p>
                </div>
              </div>

              <div style={styles.noteStack}>
                {notes.map((item) => (
                  <div key={item} style={styles.noteItem}>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.supportCard}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.supportIconBox }}>✆</div>
                <div>
                  <h2 style={{ ...styles.cardTitle, color: "#ffffff" }}>
                    Help & support
                  </h2>
                  <p style={{ ...styles.cardSubtext, color: "#cbd5e1" }}>
                    Quick help for setup and troubleshooting
                  </p>
                </div>
              </div>

              <div style={styles.supportText}>
                If you face any issue during setup or need help with theme
                placement, reach out and we’ll help you quickly.
              </div>

              <div style={styles.supportEmailBox}>
                <div style={styles.supportMiniLabel}>Support email</div>
                <a href="mailto:wishlistpro247@gmail.com" style={styles.supportLink}>
                  wishlistpro247@gmail.com
                </a>
              </div>

              <div style={styles.supportNotice}>
                Instant replies available for setup support and onboarding guidance.
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: "24px 16px 40px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
    color: "#111827",
  },
  container: {
    maxWidth: "1240px",
    margin: "0 auto",
  },
  heroCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
    marginBottom: "24px",
  },
  badge: {
    display: "inline-block",
    background: "#ecfdf3",
    color: "#027a48",
    border: "1px solid #b7ebc6",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "18px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.85fr",
    gap: "24px",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: "40px",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    margin: "0 0 14px",
    color: "#0f172a",
  },
  heroText: {
    margin: 0,
    color: "#475467",
    fontSize: "16px",
    lineHeight: 1.8,
    maxWidth: "760px",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "22px",
  },
  tag: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#334155",
    borderRadius: "16px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 600,
  },
  summaryCard: {
    borderRadius: "24px",
    padding: "24px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.18)",
  },
  summaryLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontWeight: 800,
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  summaryList: {
    display: "grid",
    gap: "12px",
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: 1.8,
  },
  handleBox: {
    marginTop: "20px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "14px 16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    fontSize: "14px",
    color: "#e2e8f0",
  },
  handlePill: {
    display: "inline-block",
    background: "#ffffff",
    color: "#111827",
    padding: "6px 10px",
    borderRadius: "10px",
    fontWeight: 700,
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.85fr",
    gap: "24px",
  },
  sideColumn: {
    display: "grid",
    gap: "24px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
  },
  supportCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "1px solid #1e293b",
    borderRadius: "24px",
    padding: "24px",
    color: "#ffffff",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.18)",
  },
  cardHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
  },
  supportIconBox: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
    background: "rgba(255,255,255,0.1)",
    color: "#ffffff",
  },
  cardTitle: {
    fontSize: "22px",
    lineHeight: 1.2,
    margin: "0 0 4px",
    color: "#0f172a",
  },
  cardSubtext: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  featureItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px 16px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: 600,
  },
  infoStack: {
    display: "grid",
    gap: "14px",
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
  },
  infoLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  infoValue: {
    color: "#475467",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  darkPill: {
    display: "inline-block",
    background: "#111827",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 700,
  },
  stepsWrap: {
    display: "grid",
    gap: "12px",
  },
  stepRow: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  stepNumber: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "999px",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "14px",
  },
  stepText: {
    paddingTop: "4px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.7,
    fontWeight: 600,
  },
  warningBox: {
    marginTop: "18px",
    padding: "16px 18px",
    borderRadius: "18px",
    border: "1px solid #fde68a",
    background: "#fff8db",
    color: "#8a5b00",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  noteStack: {
    display: "grid",
    gap: "12px",
  },
  noteItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px 16px",
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  supportText: {
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: 1.8,
    marginBottom: "16px",
  },
  supportEmailBox: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "14px",
  },
  supportMiniLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#cbd5e1",
    fontWeight: 800,
    marginBottom: "8px",
  },
  supportLink: {
    display: "block",
    color: "#ffffff",
    fontSize: "16px",
    lineHeight: 1.6,
    fontWeight: 700,
    textDecoration: "underline",
    wordBreak: "break-word",
  },
  supportNotice: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "16px",
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: 1.7,
  },
};

const responsiveCss = `
  .hero-grid {
    grid-template-columns: 1.45fr 0.85fr;
  }

  .grid-three {
    grid-template-columns: 2fr 1fr;
  }

  .grid-two {
    grid-template-columns: 1.25fr 0.85fr;
  }

  @media (max-width: 1024px) {
    .hero-grid,
    .grid-three,
    .grid-two {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 768px) {
    .feature-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 640px) {
    h1 {
      font-size: 30px !important;
    }
  }
`;