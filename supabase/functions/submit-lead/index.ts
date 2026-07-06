// Public, unauthenticated form endpoint for the short popup/modal lead
// form (js/project-modal.js). Public visitors call this directly with no
// Supabase Auth session — see auth: 'none' below. The only privileged
// piece is ctx.supabaseAdmin (service-role-equivalent, provided by the
// withSupabase wrapper from server-side env, never exposed to the
// caller), used solely to call the narrow public.internal_submit_lead RPC
// — this function never talks to private.leads directly.
import { withSupabase } from "npm:@supabase/server@^1";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, resolveAllowedOrigin } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { HttpError, readJsonBody } from "../_shared/request.ts";
import { normalizeRussianPhone } from "../_shared/phone.ts";
import {
  orUndefined,
  parseUtm,
  requireEnum,
  requireSafeUrl,
  requireUuid,
  trimmedRequired,
  ValidationError,
} from "../_shared/validation.ts";
import { extractClientIp, hashIp } from "../_shared/ip.ts";
import { checkRateLimits } from "../_shared/rate-limit.ts";

const PROJECT_TYPES = [
  "landing",
  "corporate",
  "ecommerce",
  "service",
  "redesign",
  "tilda-upgrade",
] as const;

// Matches every data-source value actually used on the site today (see
// index.html CTAs + js/configurator.js + js/portfolio.js), plus the
// 'unknown' fallback the frontend already sends when a trigger has no
// data-source attribute.
const SOURCES = [
  "hero",
  "trust",
  "configurator",
  "journey",
  "footer",
  "portfolio",
  "unknown",
] as const;

function log(outcome: string, extra: Record<string, unknown> = {}) {
  // Structured, PII-free logging only: no name/phone/contact/comment/
  // answers/raw body/raw IP/secrets ever go through this.
  console.log(JSON.stringify({ fn: "submit-lead", outcome, ...extra }));
}

export default {
  fetch: withSupabase<Database>(
    { auth: "none", cors: false },
    async (req, ctx) => {
      const startedAt = Date.now();
      const origin = req.headers.get("origin");
      const allowedOrigin = resolveAllowedOrigin(origin);
      const cors = corsHeaders(allowedOrigin);

      if (req.method === "OPTIONS") {
        // Preflight: no allowed origin means there's nothing safe to answer
        // "yes" to — respond without any Allow-Origin header.
        return new Response(null, {
          status: allowedOrigin ? 204 : 403,
          headers: cors,
        });
      }

      // CORS only constrains browsers reading the response — it cannot stop
      // a non-browser client from calling this endpoint with a forged
      // Origin header (or none at all). A present-but-unrecognized Origin
      // is rejected; an absent Origin (server-to-server test calls, curl)
      // is allowed through to the real security boundary below: honeypot,
      // strict validation, and idempotency.
      if (origin !== null && !allowedOrigin) {
        log("origin_rejected", { status: 403 });
        return errorResponse(
          403,
          "ORIGIN_NOT_ALLOWED",
          "Origin is not allowed",
          cors,
        );
      }

      if (req.method !== "POST") {
        log("method_not_allowed", { status: 405, method: req.method });
        return errorResponse(
          405,
          "METHOD_NOT_ALLOWED",
          "Only POST is supported",
          cors,
        );
      }

      try {
        const body = await readJsonBody(req);

        if (
          typeof body.honeypot === "string" && body.honeypot.trim().length > 0
        ) {
          // Bot trap tripped. Respond as if accepted (status/shape match a
          // real success) so a simple scraper isn't tipped off — but never
          // touch the database, never mint a real lead_number, never
          // notify. submissionId/createdAt are null, not a fabricated ID a
          // bot operator could later reference.
          log("honeypot", { status: 201, durationMs: Date.now() - startedAt });
          return jsonResponse(
            201,
            { ok: true, submissionId: null, createdAt: null, duplicate: false },
            cors,
          );
        }

        const name = trimmedRequired(body.name, "name", 1, 120);

        const rawPhone = typeof body.phone === "string" ? body.phone : "";
        const phone = normalizeRussianPhone(rawPhone);
        if (!phone) {
          throw new ValidationError(
            "phone must be a valid Russian phone number",
          );
        }

        const projectType = requireEnum(
          body.projectType,
          "projectType",
          PROJECT_TYPES,
        );

        // Absent/null source collapses to 'unknown' — the frontend already
        // does exactly this today when a trigger has no data-source
        // attribute (see js/project-modal.js openModal()). An explicitly
        // present but unrecognized value is a validation error, not a
        // silent coercion — only a genuinely missing field is treated as
        // "we don't know", never a garbage string.
        const source = body.source === undefined || body.source === null
          ? ("unknown" as const)
          : requireEnum(body.source, "source", SOURCES);

        const pageUrl = requireSafeUrl(body.pageUrl, "pageUrl", 2048);
        const idempotencyKey = requireUuid(
          body.idempotencyKey,
          "idempotencyKey",
        );
        const utm = parseUtm(body.utm);

        const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 500) ||
          null;
        const clientIp = extractClientIp(req);
        const pepper = Deno.env.get("IP_HASH_PEPPER");
        const ipHash = await hashIp(clientIp, pepper);

        // Rate limiting: after validation (garbage payloads never reach
        // this point) and before the actual submit RPC. lead_ip only runs
        // when we actually have a client IP (x-forwarded-for is not always
        // present — see _shared/ip.ts); lead_phone always runs, since the
        // validated phone is available unconditionally by now. Neither raw
        // IP nor raw phone is ever sent as the rate-limit key —
        // checkRateLimits hashes each with a namespace-specific salt, kept
        // separate from the ip_hash stored on the row itself.
        const withinLimits = await checkRateLimits(
          ctx.supabaseAdmin,
          pepper,
          [
            ...(clientIp
              ? [{
                bucket: "lead_ip",
                namespace: "ip" as const,
                rawValue: clientIp,
                windowSeconds: 600,
                maxCount: 3,
              }]
              : []),
            {
              bucket: "lead_phone",
              namespace: "lead-phone" as const,
              rawValue: phone,
              windowSeconds: 600,
              maxCount: 5,
            },
          ],
          (bucket, message) =>
            log("rate_limit_check_error", { bucket, message }),
        );

        if (!withinLimits) {
          // Neutral message only — never the bucket, ip/phone/hash, or how
          // many requests were made.
          log("rate_limited", {
            status: 429,
            durationMs: Date.now() - startedAt,
          });
          return errorResponse(
            429,
            "RATE_LIMITED",
            "Too many requests. Please try again later.",
            cors,
          );
        }

        // Technical metadata only — never a copy of name/phone/answers.
        const requestMeta = {
          accepted_origin: allowedOrigin,
          function_version: 1,
        };

        const { data, error } = await ctx.supabaseAdmin.rpc(
          "internal_submit_lead",
          {
            p_name: name,
            p_phone: phone,
            p_project_type: projectType,
            p_source: source,
            p_page_url: pageUrl,
            p_user_agent: orUndefined(userAgent),
            p_utm_source: orUndefined(utm.source),
            p_utm_medium: orUndefined(utm.medium),
            p_utm_campaign: orUndefined(utm.campaign),
            p_utm_term: orUndefined(utm.term),
            p_utm_content: orUndefined(utm.content),
            p_ip_hash: orUndefined(ipHash),
            p_idempotency_key: idempotencyKey,
            p_request_meta: requestMeta,
          },
        );

        if (error) {
          // Safe technical code only — never the Postgres message/detail
          // (constraint names, row contents) back to the client or into
          // client-facing logs.
          log("rpc_error", {
            status: 500,
            pgCode: error.code ?? null,
            durationMs: Date.now() - startedAt,
          });
          return errorResponse(
            500,
            "INTERNAL_ERROR",
            "Could not save the request. Please try again.",
            cors,
          );
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          log("rpc_empty_result", {
            status: 500,
            durationMs: Date.now() - startedAt,
          });
          return errorResponse(
            500,
            "INTERNAL_ERROR",
            "Could not save the request. Please try again.",
            cors,
          );
        }

        const duplicate = !!row.is_duplicate;
        log("ok", {
          status: duplicate ? 200 : 201,
          duplicate,
          durationMs: Date.now() - startedAt,
        });

        return jsonResponse(
          duplicate ? 200 : 201,
          {
            ok: true,
            submissionId: row.lead_number,
            createdAt: row.created_at,
            duplicate,
          },
          cors,
        );
      } catch (err) {
        if (err instanceof ValidationError) {
          log("validation_error", {
            status: 400,
            durationMs: Date.now() - startedAt,
          });
          return errorResponse(400, "VALIDATION_ERROR", err.message, cors);
        }
        if (err instanceof HttpError) {
          log(err.code.toLowerCase(), {
            status: err.status,
            durationMs: Date.now() - startedAt,
          });
          return errorResponse(err.status, err.code, err.message, cors);
        }
        // errorName is a constructor name only (e.g. "TypeError") — never
        // the error message, which could in principle echo back input.
        const errorName = err instanceof Error
          ? err.constructor.name
          : typeof err;
        log("unexpected_error", {
          status: 500,
          errorName,
          durationMs: Date.now() - startedAt,
        });
        return errorResponse(
          500,
          "INTERNAL_ERROR",
          "Unexpected error. Please try again.",
          cors,
        );
      }
    },
  ),
};
