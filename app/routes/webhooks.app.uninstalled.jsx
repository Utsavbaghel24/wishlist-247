// app/routes/webhooks.app.uninstalled.jsx
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    // Clean up shop data on uninstall
    await db.wishlistItem.deleteMany({
      where: { shop },
    });

    try {
      await db.wishlistSetting.deleteMany({
        where: { shop },
      });
    } catch (_) {}

    try {
      await db.shopSettings.deleteMany({
        where: { shop },
      });
    } catch (_) {}

    await db.session.deleteMany({
      where: { shop },
    });

    return new Response();
  } catch (error) {
    console.error("app/uninstalled webhook failed:", error);
    return new Response("Webhook error", { status: 500 });
  }
};