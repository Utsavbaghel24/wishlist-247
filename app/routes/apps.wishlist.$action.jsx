export async function loader() {
  return new Response(
    JSON.stringify({ ok: false, error: "Unused route" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function action() {
  return new Response(
    JSON.stringify({ ok: false, error: "Unused route" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}