// app/utils/json.server.js
export function json(data, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify(data), {...init, headers });
}