// Shared message formatting for all notification channels (Telegram, MAX,
// future channels). Kept separate from any specific channel's send logic
// so the exact same text goes out everywhere without duplicating the
// template.

export interface LeadNotification {
  submissionId: string;
  name: string;
  phone: string;
  projectType: string;
  source: string;
  pageUrl: string;
  createdAt: string;
}

export function buildLeadMessage(lead: LeadNotification): string {
  return [
    "🟢 НОВАЯ ЗАЯВКА",
    "",
    `ID: ${lead.submissionId}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Тип сайта: ${lead.projectType}`,
    `Источник: ${lead.source}`,
    `Страница: ${lead.pageUrl}`,
    `Дата: ${lead.createdAt}`,
  ].join("\n");
}

export interface BriefNotification {
  submissionId: string;
  name: string;
  contact: string;
  format: string;
  stage: string;
  goal: string;
  content: string[];
  timing: string;
  channel: string;
  comment: string | null;
  pageUrl: string;
  createdAt: string;
}

export function buildBriefMessage(brief: BriefNotification): string {
  return [
    "🟢 НОВЫЙ БРИФ",
    "",
    `ID: ${brief.submissionId}`,
    `Имя: ${brief.name}`,
    `Контакт: ${brief.contact}`,
    "",
    `Формат: ${brief.format}`,
    `Стадия: ${brief.stage}`,
    `Цель: ${brief.goal}`,
    `Контент: ${brief.content.join(", ")}`,
    `Сроки: ${brief.timing}`,
    `Канал связи: ${brief.channel}`,
    "",
    "Комментарий:",
    brief.comment || "—",
    "",
    `Страница: ${brief.pageUrl}`,
    `Дата: ${brief.createdAt}`,
  ].join("\n");
}
