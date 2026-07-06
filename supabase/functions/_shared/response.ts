/** Standard success/error JSON envelope builders shared by both functions. */

export function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

/**
 * Builds a client-safe error response. `message` must never contain SQL,
 * stack traces, Postgres constraint names, or any other internal detail —
 * callers are expected to pass a short, generic, human-readable string.
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse(
    status,
    { ok: false, error: { code, message } },
    extraHeaders,
  );
}
