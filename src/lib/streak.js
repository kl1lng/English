import { addDays } from "./time.js";

// Streak after the learner is active on `today`.
// Same rules the app used inline before: a second activity on the same day keeps the
// streak; activity right after an active yesterday adds one; otherwise it restarts at 1.
export function advanceStreak({ streak = 0, days = [], today }) {
  if (days.includes(today)) return streak;
  return days.includes(addDays(today, -1)) ? streak + 1 : 1;
}
