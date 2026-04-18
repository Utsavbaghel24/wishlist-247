export async function loader() {
  return new Response(
    JSON.stringify({
      ok: true,
      test: "toggle loader working",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function action() {
  return new Response(
    JSON.stringify({
      ok: true,
      test: "toggle action working",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}