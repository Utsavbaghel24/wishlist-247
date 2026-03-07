// app/routes/proxy.status.jsx
import crypto from "crypto";
import { data } from "react-router";
import prisma from "../db.server";

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");

  if (ab.length !== bb.length) return false;

  return crypto.timingSafeEqual(ab, bb);
}

function verifyProxySignature(requestUrl) {
  const u = new URL(requestUrl);
  const params = new URLSearchParams(u.search);

  const signature = params.get("signature");

  if (!signature) return true;

  params.delete("signature");

  const sorted = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("");

  const secret = process.env.SHOPIFY_API_SECRET;

  const digest = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return timingSafeEqual(digest, signature);
}

export async function loader({ request }) {
  try {
    if (!verifyProxySignature(request.url)) {
      return data({ ok: false, active: false, error: "Invalid signature" });
    }

    const url = new URL(request.url);

    const shop = url.searchParams.get("shop") || "";

    if (!shop) {
      return data({ ok: false, active: false, error: "Missing shop" });
    }

    const row = await prisma.wishlistSetting.findUnique({
      where: { shop },
      select: { enabled: true },
    });

    const enabled = row ? !!row.enabled : true;

    const billingDisabled =
      process.env.BILLING_DISABLED === "true" ||
      process.env.BYPASS_BILLING === "1";

    const billingActive = true;

    const active = enabled && billingActive;

    return data({
      ok: true,
      shop,
      enabled,
      billingActive,
      billingDisabled,
      active,
    });
  } catch (e) {
    return data({ ok: false, active: false, error: e?.message || "Server error" });
  }
}