// Best-effort MAX messenger notification — same trust model as
// _shared/telegram.ts: called only AFTER a row is already committed,
// never a precondition for treating the submission as accepted, never
// throws out of this module, never logs the token or any submission PII.
//
// Official MAX Bot API (checked 2026-07-06, dev.max.ru/docs-api):
//   POST https://platform-api2.max.ru/messages
//   Authorization: <token>  (bare token, no "Bot " prefix — unlike Telegram)
//   body: { chat_id, text }
// platform-api2.max.ru is the current endpoint — platform-api.max.ru is
// being retired (redirect deadline 2026-07-19), so the old host was never
// used here.
import {
  type BriefNotification,
  buildBriefMessage,
  buildLeadMessage,
  type LeadNotification,
} from "./notification-format.ts";

const MAX_API_URL = "https://platform-api2.max.ru/messages";
const MAX_TIMEOUT_MS = 5000;

async function sendMaxMessage(text: string): Promise<void> {
  const token = Deno.env.get("MAX_BOT_TOKEN");
  const chatIdRaw = Deno.env.get("MAX_CHAT_ID");

  if (!token || !chatIdRaw) {
    console.log(
      JSON.stringify({ fn: "max", outcome: "skipped_missing_config" }),
    );
    return;
  }

  // MAX chat_id is numeric; fall back to the raw string if it somehow
  // isn't, rather than silently sending a broken value.
  const chatId = /^-?\d+$/.test(chatIdRaw) ? Number(chatIdRaw) : chatIdRaw;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

  try {
    const res = await fetch(MAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Never log the response body — some MAX API errors can echo parts
      // of the request back, which would leak submission content.
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
