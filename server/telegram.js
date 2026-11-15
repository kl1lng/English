import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { formatWeekly, weeklySummary } from "../src/lib/weekly.js";

// Helpers for Telegram reminders. The bot token, webhook secret and the Supabase service
// key come only from environment variables on the server.
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{16,64}$/;

// Constant-time comparison of the webhook secret header.
export function secretMatches(received, expected) {
  if (!expected || typeof received !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Reads "/start <token>" from a Telegram update. Returns { chatId, token } or null.
export function parseStart(update) {
  const message = update?.message;
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  const chatId = message?.chat?.id;
  if (!Number.isSafeInteger(chatId) || message?.chat?.type !== "private") return null;
  const match = text.match(/^\/start(?:@\w+)?\s+(\S+)$/);
  if (!match || !TOKEN_FORMAT.test(match[1])) return null;
  return { chatId, token: match[1] };
}

export const chatIdOf = (update) => {
  const id = update?.message?.chat?.id;
  return Number.isSafeInteger(id) ? id : null;
};

export function reminderText({ streak = 0 }) {
  return streak > 0
    ? `Your ${streak}-day streak is waiting. A short lesson or 10 word reviews keeps it going today.`
    : "A few minutes of English today: one short lesson or 10 word reviews. Start when you are ready.";
}

// Who should get a reminder: linked, not reminded today, and has not practised today.
export function shouldRemind({ link, practisedToday, today }) {
  return Boolean(link?.chat_id) && link.last_sent_on !== today && !practisedToday;
}

export function serviceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function sendTelegram(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  return { ok: response.ok, status: response.status };
}

// What to send today (or null). Sunday: the weekly summary for everyone linked. Other days: the
// reminder, only for those who have not practised. Never twice in a day.
export function messageFor({ link, practisedToday, today, profile = {} }) {
  if (!link?.chat_id || link.last_sent_on === today) return null;
  const isSunday = new Date(`${today}T12:00:00Z`).getUTCDay() === 0;
  if (isSunday) {
    const summary = weeklySummary({
      today,
      days: profile.days || [],
      submissions: profile.submissions || [],
      streak: profile.streak || 0,
    });
    return formatWeekly(summary);
  }
  return practisedToday ? null : reminderText({ streak: profile.streak || 0 });
}
