import crypto from "crypto";
import prisma from "../db.server";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

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
  if (!secret) return false;

  const digest = crypto.createHmac("sha256", secret).update(sorted).digest("hex");
  return timingSafeEqual(digest, signature);
}

function getShop(request) {
  const url = new URL(request.url);

  const qpShop = url.searchParams.get("shop");
  if (qpShop) return qpShop;

  const hShop = request.headers.get("x-shopify-shop-domain");
  if (hShop) return hShop;

  const xfHost = request.headers.get("x-forwarded-host");
  if (xfHost && xfHost.includes(".myshopify.com")) {
    return xfHost.split(",")[0].trim();
  }

  return "";
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await request.json();
  const text = await request.text();
  return Object.fromEntries(new URLSearchParams(text));
}

function readQuery(request) {
  const url = new URL(request.url);
  return {
    customerId: url.searchParams.get("customerId") || "guest",
    productId: url.searchParams.get("productId") || "",
    variantId: url.searchParams.get("variantId") || "",
  };
}

async function handleToggle(request, source = "GET") {
  try {
    if (!verifyProxySignature(request.url)) {
      return json({ ok: false, error: "Invalid signature", source }, 200);
    }

    const shop = getShop(request);
    if (!shop) {
      return json({ ok: false, error: "Missing shop", source }, 200);
    }

    const input =
      request.method === "POST" ? await readBody(request) : readQuery(request);

    const customerId = String(input.customerId || "guest");
    const productId = String(input.productId || "");
    const variantId = String(input.variantId || "");

    if (!productId || !variantId) {
      return json(
        { ok: false, error: "Missing productId or variantId", source },
        200
      );
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        shop,
        customerId,
        variantId,
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });

      return json(
        {
          ok: true,
          wishlisted: false,
          action: "removed",
          source,
          shop,
          customerId,
          productId,
          variantId,
        },
        200
      );
    }

    await prisma.wishlistItem.create({
      data: {
        shop,
        customerId,
        productId,
        variantId,
      },
    });

    return json(
      {
        ok: true,
        wishlisted: true,
        action: "added",
        source,
        shop,
        customerId,
        productId,
        variantId,
      },
      200
    );
  } catch (e) {
    console.error("TOGGLE ERROR:", e);
    return json(
      {
        ok: false,
        error: e?.message || "Server error",
        source,
      },
      200
    );
  }
}

export async function loader({ request }) {
  return handleToggle(request, "loader");
}

export async function action({ request }) {
  return handleToggle(request, "action");
}