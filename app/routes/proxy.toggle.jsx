export async function loader({ request }) {
  const url = new URL(request.url);

  return new Response(
    JSON.stringify({
      ok: true,
      route: "proxy.toggle loader",
      shop: url.searchParams.get("shop"),
      customerId: url.searchParams.get("customerId"),
      productId: url.searchParams.get("productId"),
      variantId: url.searchParams.get("variantId")
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function action({ request }) {
  return new Response(
    JSON.stringify({
      ok: true,
      route: "proxy.toggle action"
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}