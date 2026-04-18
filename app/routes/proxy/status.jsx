function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || "";

    return json({
      ok: true,
      shop,
      enabled: true,
      billingActive: true,
      billingDisabled: false,
      active: true,
    });
  } catch (e) {
    return json({
      ok: false,
      error: e?.message || "Server error",
    });
  }
}