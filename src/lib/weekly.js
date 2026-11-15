import { MISTAKE_TAG_LABELS } from "../data/mistake-tags.js";
import { lessons as allLessons } from "../lessons.js";
import { addDays } from "./time.js";

// Day keys are YYYY-MM-DD. The week runs Monday to Sunday.
export function weekRange(today) {
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  const sinceMonday = (weekday + 6) % 7;
  const start = addDays(today, -sinceMonday);
  return { start, end: addDays(start, 6) };
}

const inRange = (day, range) => day >= range.start && day <= range.end;

// Numbers for "This week". reviews and conversations are null when unknown.
export function weeklySummary({
  today,
  days = [],
  submissions = [],
  reviews = null,
  conversations = null,
  streak = 0,
  topTag = null,
  lessons = allLessons,
}) {
  const range = weekRange(today);
  const done = new Set();
  for (const s of submissions) {
    if (!inRange(s.day, range)) continue;
    const min = lessons[Number(s.lessonIndex)]?.minimumDurationSeconds ?? Infinity;
    if (Number(s.recordingDuration || 0) >= min) done.add(Number(s.lessonIndex));
  }
  const activeSet = new Set(days.filter((d) => inRange(d, range)));
  return {
    range,
    dayFlags: Array.from({ length: 7 }, (_, i) => activeSet.has(addDays(range.start, i))),
    activeDays: activeSet.size,
    lessons: done.size,
    reviews,
    conversations,
    streak,
    topTag,
  };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Short, friendly text for the dashboard and the Telegram message.
export function formatWeekly(s) {
  if (!s.activeDays && !s.lessons && !s.reviews && !s.conversations)
    return "Quiet week. One short lesson or ten word reviews gets you going again.";
  const parts = [`You practised on ${plural(s.activeDays, "day", "days")}`];
  if (s.lessons) parts.push(plural(s.lessons, "lesson", "lessons"));
  if (s.reviews) parts.push(`${s.reviews} words reviewed`);
  if (s.conversations) parts.push(plural(s.conversations, "conversation", "conversations"));
  let text = `${parts.join(", ")}.`;
  if (s.streak >= 2) text += ` ${s.streak}-day streak.`;
  if (s.topTag && s.topTag !== "other") text += ` Most common slip: ${MISTAKE_TAG_LABELS[s.topTag]}.`;
  return text;
}
