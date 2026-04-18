export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";

  return new Response(
    JSON.stringify({
      ok: true,
      shop,
      active: true,
      enabled: true,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}