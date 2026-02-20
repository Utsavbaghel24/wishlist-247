// app/routes/app.jsx

import { Outlet, useLocation, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

import { Frame, Navigation } from "@shopify/polaris";
import {
  SettingsIcon,
  QuestionCircleIcon,
  CreditCardIcon,
} from "@shopify/polaris-icons";

/**
 * LOADER
 * Verifies admin session.
 * If session is invalid, Shopify helper automatically redirects to /auth.
 */
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

/**
 * APP LAYOUT
 */
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Preserve host + shop query params
  const queryString = location.search || "";

  const go = (path) => {
    navigate(`${path}${queryString}`);
  };

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            title="Wishlist-247"
            items={[
              {
                label: "Settings",
                icon: SettingsIcon,
                onClick: () => go("/app/settings"),
              },
              {
                label: "Plans",
                icon: CreditCardIcon,
                onClick: () => go("/app/pricing"),
              },
              {
                label: "Help",
                icon: QuestionCircleIcon,
                onClick: () => go("/app/help"),
              },
            ]}
          />
        </Navigation>
      }
    >
      <Outlet />
    </Frame>
  );
}

/**
 * Required for embedded response headers
 */
export const headers = (headersArgs) =>
  boundary.headers(headersArgs);