// Public, unauthenticated form endpoint for the 7-step brief (js/brief.js).
// Same trust model as submit-lead: auth: 'none', ctx.supabaseAdmin used
// only to call the narrow public.internal_submit_brief RPC, never a
// direct write to private.briefs.
import { withSupabase } from "npm:@supabase/server@^1";
import type { Database } from "../_shared/database.types.ts";
import { corsHeaders, resolveAllowedOrigin } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { HttpError, readJsonBody } from "../_shared/request.ts";
import {
  looksLikeBotchedPhone,
  normalizeRussianPhone,
} from "../_shared/phone.ts";
import {
  isPlainObject,
  orUndefined,
  parseUtm,
  requireEnum,
  requireSafeUrl,
  requireUuid,
  trimmedOptional,
  trimmedRequired,
  ValidationError,
} from "../_shared/validation.ts";
import type { Json } from "../_shared/database.types.ts";
import { extractClientIp, hashIp } from "../_shared/ip.ts";
import { checkRateLimits } from "../_shared/rate-limit.ts";
import { notifyNewBrief } from "../_shared/telegram.ts";
import { notifyNewBriefMax } from "../_shared/max.ts";

// Exact literal option strings from js/brief.js QUIZ_STEPS — re-verified
// against the current file, not assumed from memory. Any value outside
// these lists is a validation error, not silently coerced.
const FORMAT_VALUES = [
  "Лендинг",
  "Корпоративный сайт",
  "Интернет-магазин",
  "Сайт услуг",
  "Редизайн",
  "Доработки на Tilda",
] as const;

const STAGE_VALUES = [
  "Есть только идея",
  "Есть материалы",
  "Есть старый сайт",
  "Нужно всё с нуля",
] as const;

const GOAL_VALUES = [
  "Получать заявки",
  "Упаковать бизнес",
  "Показать услуги",
  "Продавать товары",
  "Обновить старый сайт",
  "Подготовить к рекламе",
] as const;

const CONTENT_VALUES = [
  "Структура",
  "Тексты",
  "Фото",
  "Логотип",
  "Примеры сайтов",
  "Ничего нет",
  "Нужна помощь с контентом",
] as const;

const TIMING_VALUES = [
  "Как можно скорее",
  "За 1–2 недели",
  "В течение месяца",
  "Пока выбираю подрядчика",
] as const;

const CHANNEL_VALUES = [
  "Telegram",
  "WhatsApp",
  "MAX",
  "Звонок",
  "Email",
] as const;

function log(outcome: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: "submit-brief", outcome, ...extra }));
}

interface ValidatedAnswers {
  format: string;
  stage: string;
  goal: string;
  content: string[];
  timing: string;
  channel: string;
}

function validateAnswers(value: unknown): ValidatedAnswers {
  if (!isPlainObject(value)) {
    throw new ValidationError("answers must be an object");
  }

  const format = requireEnum(value.format, "answers.format", FORMAT_VALUES);
  const stage = requireEnum(value.stage, "answers.stage", STAGE_VALUES);
  const goal = requireEnum(value.goal, "answers.goal", GOAL_VALUES);
  const timing = requireEnum(value.timing, "answers.timing", TIMING_VALUES);
  const channel = requireEnum(value.channel, "answers.channel", CHANNEL_VALUES);

  if (!Array.isArray(value.content)) {
    throw new ValidationError("answers.content must be an array");
  }
  // The CONTENT step has exactly 7 defined options in brief.js — there is
  // no legitimate way to have more distinct selections than that.
  if (value.content.length < 1 || value.content.length > 7) {
    throw new ValidationError(
      "answers.content has an unexpected number of items",
    );
  }
  const content = value.content.map((item, i) =>
    requireEnum(item, `answers.content[${i}]`, CONTENT_VALUES)
  );

  // Re-serialized from validated parts only — this also strips any extra
  // unexpected keys the caller might have included.
  return { format, stage, goal, content, timing, channel };
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
        return new Response(null, {
          status: allowedOrigin ? 204 : 403,
          headers: cors,
        });
      }

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
          log("honeypot", { status: 201, durationMs: Date.now() - startedAt });
          return jsonResponse(
            201,
            { ok: true, submissionId: null, createdAt: null, duplicate: false },
            cors,
          );
        }

        const name = trimmedRequired(body.name, "name", 1, 120);

        const rawContact = trimmedRequired(body.contact, "contact", 1, 190);
        const asPhone = normalizeRussianPhone(rawContact);
        let contact: string;
        let contactType: "phone" | "handle";
        if (asPhone) {
          contact = asPhone;
          contactType = "phone";
        } else if (looksLikeBotchedPhone(rawContact)) {
          // A pure-digit string that ISN'T a valid phone shape is almost
          // certainly a mistyped/incomplete phone number, not a real
          // messenger handle — reject rather than silently filing it away
          // as a "handle".
          throw new ValidationError(
            "contact does not look like a valid phone number",
          );
        } else {
          contact = rawContact;
          contactType = "handle";
        }

        const comment = trimmedOptional(body.comment, "comment", 2000);
        const answers = validateAnswers(body.answers);
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

        // Rate limiting: after validation and before the actual submit
        // RPC. brief_ip only runs when a client IP is available;
        // brief_contact always runs, keyed by whichever normalized form
        // (phone or handle) contact already resolved to above. Neither raw
        // IP nor raw contact is ever sent as the rate-limit key —
        // checkRateLimits hashes each with a namespace-specific salt, kept
        // separate from the ip_hash stored on the row itself.
        const withinLimits = await checkRateLimits(
          ctx.supabaseAdmin,
          pepper,
          [
            ...(clientIp
              ? [{
                bucket: "brief_ip",
                namespace: "ip" as const,
                rawValue: clientIp,
                windowSeconds: 1200,
                maxCount: 3,
              }]
              : []),
            {
              bucket: "brief_contact",
              namespace: "brief-contact" as const,
              rawValue: contact,
              windowSeconds: 1200,
              maxCount: 5,
            },
          ],
          (bucket, message) =>
            log("rate_limit_check_error", { bucket, message }),
        );

        if (!withinLimits) {
          // Neutral message only — never the bucket, ip/contact/hash, or
          // how many requests were made.
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

        const requestMeta = {
          accepted_origin: allowedOrigin,
          function_version: 1,
        };

        const { data, error } = await ctx.supabaseAdmin.rpc(
          "internal_submit_brief",
          {
            p_name: name,
            p_contact: contact,
            // `answers` is a plain object of already-enum-validated string
            // fields — structurally JSON-compatible; the cast only works
            // around Json's index-signature requirement, not a real type gap.
            p_answers: answers as unknown as Json,
            p_page_url: pageUrl,
            p_contact_type: contactType,
            p_comment: orUndefined(comment),
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

        // Same reasoning as submit-lead: row already committed, Telegram
        // and MAX are both best-effort only, and a replay must not
        // re-notify either channel.
        if (!duplicate) {
          const notification = {
            submissionId: row.brief_number,
            name,
            contact,
            format: answers.format,
            stage: answers.stage,
            goal: answers.goal,
            content: answers.content,
            timing: answers.timing,
            channel: answers.channel,
            comment,
            pageUrl,
            createdAt: row.created_at,
          };
          await notifyNewBrief(notification);
          await notifyNewBriefMax(notification);
        }

        return jsonResponse(
          duplicate ? 200 : 201,
          {
            ok: true,
            submissionId: row.brief_number,
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
