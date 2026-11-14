import { addDays } from "./time.js";

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;

// Streak after the learner is active on `today`.
// A second activity on the same day keeps the streak; activity right after an active
// (or frozen) yesterday adds one; otherwise it restarts at 1.
export function advanceStreak({ streak = 0, days = [], freezeDays = [], today }) {
  if (days.includes(today)) return streak;
  const yesterday = addDays(today, -1);
  return days.includes(yesterday) || freezeDays.includes(yesterday)
    ? streak + 1
    : 1;
}

// A freeze bridges exactly one missed day: yesterday was missed, the day before was
// active, and a freeze is available. Returns the updated freeze state.
export function settleFreeze({ days = [], freezeDays = [], freezes = 0, today }) {
  const yesterday = addDays(today, -1);
  const before = addDays(today, -2);
  const yesterdayCovered = days.includes(yesterday) || freezeDays.includes(yesterday);
  const chainAlive = days.includes(before) || freezeDays.includes(before);
  if (days.includes(today) || yesterdayCovered || !chainAlive || freezes < 1)
    return { used: false, freezes, freezeDays };
  return {
    used: true,
    freezes: freezes - 1,
    freezeDays: [...freezeDays, yesterday],
  };
}

// One freeze for every 7 days of streak, up to MAX_FREEZES.
export function earnFreeze({ streak, lastGrantedAt = 0, freezes = 0 }) {
  if (streak < FREEZE_EVERY || streak % FREEZE_EVERY !== 0 || streak === lastGrantedAt)
    return { granted: false, freezes, lastGrantedAt };
  if (freezes >= MAX_FREEZES) return { granted: false, freezes, lastGrantedAt: streak };
  return { granted: true, freezes: freezes + 1, lastGrantedAt: streak };
}
