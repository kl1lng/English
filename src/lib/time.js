// Date helpers. A "day key" is a YYYY-MM-DD string in the learner's time zone.
export const DEFAULT_TZ = "Asia/Oral";

export function dayKey(date = new Date(), tz = DEFAULT_TZ) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// Calendar arithmetic on day keys (no time zone involved, so no DST surprises).
export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
