import { localDateKey } from "./format.js";

export const fallbackUser = {
  name: "Antoshka",
  demo: true,
  completed: 6,
  streak: 4,
  bestStreak: 4,
  days: Array.from({ length: 4 }, (_, i) => {
    const day = new Date(`${localDateKey()}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 4 + i);
    return localDateKey(day);
  }),
  submissions: [],
};

// What a brand-new registered learner starts with (no demo progress).
export const emptyUser = {
  name: "Learner",
  completed: 0,
  streak: 0,
  bestStreak: 0,
  days: [],
  submissions: [],
};
