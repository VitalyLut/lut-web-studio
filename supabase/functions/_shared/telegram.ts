// Best-effort Telegram notification. Called only AFTER a row is already
// committed in private.leads/private.briefs — never a precondition for
// treating the submission as accepted. Any failure here (missing config,
// network error, non-2xx from Telegram, timeout) is swallowed and only
// logged with a safe, PII-free outcome — never re-thrown, never surfaced
// to the caller's HTTP response.
import {
  type BriefNotification,
  buildBriefMessage,
  buildLeadMessage,
  type LeadNotification,
} from "./notification-format.ts";

const TELEGRAM_TIMEOUT_MS = 5000;

async function sendTelegramMessage(text: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    console.log(
      JSON.stringify({ fn: "telegram", outcome: "skipped_missing_config" }),
    );
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      // Never log the response body — Telegram echoes the request back on
      // some errors, which would leak submission content into logs.
      console.log(
        JSON.stringify({
          fn: "telegram",
          outcome: "send_failed",
          status: res.status,
        }),
      );
    }
  } catch (err) {
    const errorName = err instanceof Error ? err.constructor.name : typeof err;
    console.log(
      JSON.stringify({ fn: "telegram", outcome: "send_error", errorName }),
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  await sendTelegramMessage(buildLeadMessage(lead));
}

export async function notifyNewBrief(brief: BriefNotification): Promise<void> {
  await sendTelegramMessage(buildBriefMessage(brief));
}
