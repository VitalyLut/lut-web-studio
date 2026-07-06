// Strict origin allow-list — no wildcard, no arbitrary *.vercel.app preview
// domains. Every entry here must be a real, known origin we control.
//
//   - lutstudio.ru / www.lutstudio.ru: the permanent production domain,
//     connected in Vercel as of 2026-07-06 (www redirects to the bare
//     domain via a 308 in Vercel, but browsers still send Origin as
//     www.lutstudio.ru for any request made before that redirect settles,
//     so both forms stay listed)
//   - lut-web-studio.vercel.app: the original temporary Vercel alias —
//     kept intentionally, still used for technical verification and as a
//     production deployment target alongside the custom domain, not just
//     a leftover
//   - localhost dev origins: VS Code Live Server default (127.0.0.1:5500 /
//     localhost:5500), confirmed as the actual local dev setup
const ALLOWED_ORIGINS: readonly string[] = [
  "https://lut-web-studio.vercel.app",
  "https://lutstudio.ru",
  "https://www.lutstudio.ru",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

/**
 * Returns the exact allowed origin to echo back in
 * Access-Control-Allow-Origin, or null if the request's Origin header is
 * absent or not on the allow-list. Never returns "*".
 */
export function resolveAllowedOrigin(
  originHeader: string | null,
): string | null {
  if (!originHeader) return null;
  return ALLOWED_ORIGINS.includes(originHeader) ? originHeader : null;
}

/**
 * Builds the CORS response headers for a given (already-resolved) allowed
 * origin. Always includes `Vary: Origin` so caches/CDNs don't serve one
 * origin's CORS headers to a different origin. When allowedOrigin is null
 * (unknown/absent Origin), only Vary is set — no Allow-Origin header, so
 * a browser will refuse to let cross-origin JS read the response.
 */
export function corsHeaders(
  allowedOrigin: string | null,
): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "content-type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}
