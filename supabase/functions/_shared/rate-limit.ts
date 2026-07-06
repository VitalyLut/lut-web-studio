import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "./database.types.ts";

/**
 * Namespaced SHA-256 hash for rate-limit bucket keys. Deliberately
 * separate from _shared/ip.ts's hashIp(): that one produces the value
 * stored in leads.ip_hash/briefs.ip_hash for record-keeping. This one
 * produces a value that only ever lives in private.rate_limit_events,
 * with the namespace folded into the hash input itself (not just the
 * bucket name) so that a key_hash computed here can never be equated
 * with a key_hash computed for a different namespace even if the
 * underlying raw value (e.g. the same phone number reused as a brief
 * contact later) were identical — cross-bucket correlation by hash
 * equality is not possible.
 */
async function hashForRateLimit(
  namespace: "ip" | "lead-phone" | "brief-contact",
  rawValue: string,
  pepper: string | undefined,
): Promise<string> {
  const material = `${pepper ?? ""}:${namespace}:${rawValue}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface RateLimitBucket {
  bucket: string;
  namespace: "ip" | "lead-phone" | "brief-contact";
  rawValue: string;
  windowSeconds: number;
  maxCount: number;
}

/**
 * Runs each bucket check in order, short-circuiting on the first one that
 * reports the limit exceeded. Returns true only if every bucket allowed
 * the request (and each allowed check already recorded its own event —
 * see internal_check_rate_limit itself).
 *
 * Fail-open by design: an unexpected error from the RPC call itself
 * (not a normal "false" result — an actual thrown/returned error, e.g. a
 * transient network blip) is logged and treated as "allowed" rather than
 * blocking the request. The rate limiter is one layer of several
 * (honeypot, strict validation, idempotency); a hiccup in this one layer
 * should not take down the primary submit path for every legitimate
 * visitor. This is a deliberate trade-off, not an oversight.
 */
export async function checkRateLimits(
  supabaseAdmin: SupabaseClient<Database>,
  pepper: string | undefined,
  buckets: RateLimitBucket[],
  onError: (bucket: string, message: string) => void,
): Promise<boolean> {
  for (const check of buckets) {
    const keyHash = await hashForRateLimit(
      check.namespace,
      check.rawValue,
      pepper,
    );

    const { data, error } = await supabaseAdmin.rpc(
      "internal_check_rate_limit",
      {
        p_bucket: check.bucket,
        p_key_hash: keyHash,
        p_window_seconds: check.windowSeconds,
        p_max_count: check.maxCount,
      },
    );

    if (error) {
      onError(check.bucket, error.message);
      continue; // fail open for this bucket, still evaluate the rest
    }

    if (data === false) {
      return false;
    }
  }
  return true;
}
