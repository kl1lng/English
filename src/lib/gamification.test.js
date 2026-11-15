import { describe, expect, it } from "vitest";
import { advanceStreak, earnFreeze, settleFreeze } from "./streak.js";
import { awardFor, countsForStreak, dailyGoalProgress, levelFor, normalizeDaily } from "./xp.js";
import { BADGES, newlyEarned } from "./badges.js";

const today = "2026-11-14";

describe("freeze", () => {
  it("bridges exactly one missed day", () => {
    const r = settleFreeze({ days: ["2026-11-12"], freezes: 1, today });
    expect(r.used).toBe(true);
    expect(r.freezes).toBe(0);
    expect(r.freezeDays).toEqual(["2026-11-13"]);
    expect(
      advanceStreak({ streak: 5, days: ["2026-11-12"], freezeDays: r.freezeDays, today }),
    ).toBe(6);
  });
  it("does not rescue two missed days", () => {
    expect(settleFreeze({ days: ["2026-11-11"], freezes: 2, today }).used).toBe(false);
  });
  it("does not spend a freeze when nothing was missed or none is left", () => {
    expect(settleFreeze({ days: ["2026-11-13"], freezes: 1, today }).used).toBe(false);
    expect(settleFreeze({ days: ["2026-11-12"], freezes: 0, today }).used).toBe(false);
    expect(settleFreeze({ days: [today], freezes: 1, today }).used).toBe(false);
  });
  it("earns one per 7 days, capped at 2, and only once per milestone", () => {
    expect(earnFreeze({ streak: 7, freezes: 0 }).granted).toBe(true);
    expect(earnFreeze({ streak: 7, lastGrantedAt: 7, freezes: 1 }).granted).toBe(false);
    expect(earnFreeze({ streak: 14, freezes: 2 }).granted).toBe(false);
    expect(earnFreeze({ streak: 6, freezes: 0 }).granted).toBe(false);
  });
});

describe("levels", () => {
  it("maps xp to level and progress", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(175)).toMatchObject({ level: 2, start: 100, next: 250, pct: 50 });
  });
  it("keeps going past the table", () => {
    expect(levelFor(4500).level).toBe(10);
    expect(levelFor(5500).level).toBe(11);
  });
});

describe("xp awards", () => {
  it("gives lesson xp and limits retries to one per day", () => {
    const first = awardFor({ type: "lesson_first" }, null, today);
    expect(first.xp).toBe(50);
    const a = awardFor({ type: "lesson_retry" }, first.daily, today);
    expect(a.xp).toBe(10);
    expect(awardFor({ type: "lesson_retry" }, a.daily, today).xp).toBe(0);
  });
  it("caps review xp per day and resets on a new day", () => {
    let daily = { day: today, reviewXp: 99, retryDone: false, reviews: 0 };
    const r1 = awardFor({ type: "review", rating: 3 }, daily, today);
    expect(r1.xp).toBe(1);
    expect(awardFor({ type: "review", rating: 3 }, r1.daily, today).xp).toBe(0);
    expect(normalizeDaily(r1.daily, "2026-11-15").reviewXp).toBe(0);
  });
  it("gives xp for a finished conversation", () => {
    expect(awardFor({ type: "dialogue" }, null, today).xp).toBe(20);
  });
  it("caps game xp per day", () => {
    let daily = null;
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const r = awardFor({ type: "game" }, daily, today);
      daily = r.daily;
      total += r.xp;
    }
    expect(total).toBe(30);
  });
  it("scales the streak bonus up to 7 days", () => {
    expect(awardFor({ type: "streak_day", streak: 3 }, null, today).xp).toBe(15);
    expect(awardFor({ type: "streak_day", streak: 30 }, null, today).xp).toBe(35);
  });
});

describe("daily goal", () => {
  it("tracks lesson-only and lesson+review goals", () => {
    expect(dailyGoalProgress({ goal: "lesson", lessonDone: true, reviewsToday: 0 }).done).toBe(true);
    const g = dailyGoalProgress({ goal: "lesson+review", lessonDone: true, reviewsToday: 4 });
    expect(g.done).toBe(false);
    expect(g.pct).toBe(50);
    expect(dailyGoalProgress({ goal: "lesson+review", lessonDone: true, reviewsToday: 10 }).done).toBe(true);
  });
  it("a day counts for the streak with a lesson or 10 reviews", () => {
    expect(countsForStreak({ lessonDone: false, reviewsToday: 9 })).toBe(false);
    expect(countsForStreak({ lessonDone: false, reviewsToday: 10 })).toBe(true);
    expect(countsForStreak({ lessonDone: true, reviewsToday: 0 })).toBe(true);
  });
});

describe("badges", () => {
  const base = { completedCount: 0, streak: 0, bestStreak: 0, wordsLearned: 0, reviewsTotal: 0, level: 1 };
  it("awards each badge once, at the right threshold", () => {
    expect(newlyEarned([], base)).toEqual([]);
    const ids = newlyEarned([], { ...base, completedCount: 1 }).map((b) => b.id);
    expect(ids).toEqual(["first-voice"]);
    expect(newlyEarned(["first-voice"], { ...base, completedCount: 1 })).toEqual([]);
    expect(newlyEarned([], { ...base, streak: 7 }).map((b) => b.id)).toEqual(["streak-3", "streak-7"]);
  });
  it("awards the four-week rhythm badge once the weekly streak reaches four", () => {
    expect(newlyEarned([], { ...base, weeklyStreak: 3 })).toEqual([]);
    expect(newlyEarned([], { ...base, weeklyStreak: 4 }).map((b) => b.id)).toEqual(["rhythm-4"]);
  });
  it("has unique ids", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});
