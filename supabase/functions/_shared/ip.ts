/**
 * Best-effort client IP extraction. Supabase's edge gateway populates
 * x-forwarded-for with the real client IP as the first entry (documented,
 * platform-set — not something an arbitrary caller can inject ahead of
 * the gateway's own hop), but the header is not always present. Callers
 * must treat a null result as "unknown", not as an error.
 */
export function extractClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return null;
  const first = xff.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

/**
 * SHA-256 hash of the client IP, salted with an optional server-side
 * pepper (IP_HASH_PEPPER secret — not created/set by this code). Never
 * stores or logs the raw IP. Hashing still occurs without a pepper (still
 * not the raw IP), just with weaker resistance to offline guessing of
 * common IPs — see the PRE-DEPLOY REPORT for the open decision on whether
 * the pepper secret must exist before deploy.
 */
export async function hashIp(
  ip: string | null,
  pepper: string | undefined,
): Promise<string | null> {
  if (!ip) return null;
  const material = pepper ? `${pepper}:${ip}` : ip;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
