// app/routes/app.jsx
import { Outlet, useLocation, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

import { Frame, Navigation } from "@shopify/polaris";
import { SettingsIcon, QuestionCircleIcon, CreditCardIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const qs = location.search || "";

  const go = (path) => navigate(`${path}${qs}`);

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            title="Wishlist-247"
            items={[
              { label: "Settings", icon: SettingsIcon, onClick: () => go("/app/settings") },
              { label: "Plans", icon: CreditCardIcon, onClick: () => go("/app/pricing") },
              { label: "Help", icon: QuestionCircleIcon, onClick: () => go("/app/help") },
            ]}
          />
        </Navigation>
      }
    >
      <Outlet />
    </Frame>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
