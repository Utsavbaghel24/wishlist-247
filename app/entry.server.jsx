// app/entry.server.jsx
import { PassThrough } from "node:stream";
import { createElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { addDocumentResponseHeaders } from "./shopify.server";

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext
) {
  // ✅ Adds required embedded app headers (CSP etc.)
  addDocumentResponseHeaders(request, responseHeaders);

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      createElement(ServerRouter, { context: routerContext, url: request.url }),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(body, {
              status: responseStatusCode,
              headers: responseHeaders,
            })
          );

          pipe(body);
        },
        onShellError(err) {
          reject(err);
        },
        onError(err) {
          if (shellRendered) {
            console.error(err);
          }
        },
      }
    );

    setTimeout(abort, 5000);
  });
}
