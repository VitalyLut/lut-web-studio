// Best-effort MAX messenger notification — same trust model as
// _shared/telegram.ts: called only AFTER a row is already committed,
// never a precondition for treating the submission as accepted, never
// throws out of this module, never logs the token or any submission PII.
//
// Confirmed working contract (2026-07-06, verified with a real delivered
// test message):
//   POST https://platform-api.max.ru/messages?chat_id={chat_id}
//   Authorization: <token>  (bare token, no "Bot " prefix — unlike Telegram)
//   Content-Type: application/json
//   body: { "text": "..." }  — chat_id is NOT repeated in the body, it is
//   a query parameter only.
//
// platform-api.max.ru (not platform-api2.max.ru) is used deliberately:
// platform-api2.max.ru failed at the TLS/transport layer in this runtime
// (fetch threw before any HTTP response — same "unable to get local
// issuer certificate" symptom reproduced locally with curl against that
// host, consistent with MAX's own note that platform-api2.max.ru requires
// the Mintsifry root CA in the trust store). platform-api.max.ru is the
// old host, still functional during the transition period (redirect
// deadline 2026-07-19 per MAX's docs) and is what real messages have been
// confirmed delivered through.
import {
  type BriefNotification,
  buildBriefMessage,
  buildLeadMessage,
  type LeadNotification,
} from "./notification-format.ts";

const MAX_API_BASE_URL = "https://platform-api.max.ru/messages";
const MAX_TIMEOUT_MS = 5000;

async function sendMaxMessage(text: string): Promise<void> {
  const token = Deno.env.get("MAX_BOT_TOKEN");
  const chatId = Deno.env.get("MAX_CHAT_ID");

  if (!token || !chatId) {
    console.log(
      JSON.stringify({ fn: "max", outcome: "skipped_missing_config" }),
    );
    return;
  }

  const url = `${MAX_API_BASE_URL}?chat_id=${encodeURIComponent(chatId)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Safe technical code only — never the response body (could echo
      // request content back) and never the token.
      console.log(
        JSON.stringify({
          fn: "max",
          outcome: "send_failed",
          status: res.status,
        }),
      );
    }
  } catch (err) {
    const errorName = err instanceof Error ? err.constructor.name : typeof err;
    console.log(
      JSON.stringify({ fn: "max", outcome: "send_error", errorName }),
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function notifyNewLeadMax(lead: LeadNotification): Promise<void> {
  await sendMaxMessage(buildLeadMessage(lead));
}

export async function notifyNewBriefMax(
  brief: BriefNotification,
): Promise<void> {
  await sendMaxMessage(buildBriefMessage(brief));
}
