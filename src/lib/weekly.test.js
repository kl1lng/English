import { describe, expect, it } from "vitest";
import { formatWeekly, normalizeGoalDays, weekRange, weeklyGoalProgress, weeklyStreak, weeklySummary } from "./weekly.js";

describe("weekRange", () => {
  it("runs Monday to Sunday around any day", () => {
    expect(weekRange("2026-11-15")).toEqual({ start: "2026-11-09", end: "2026-11-15" }); // Sunday
    expect(weekRange("2026-11-09")).toEqual({ start: "2026-11-09", end: "2026-11-15" }); // Monday
    expect(weekRange("2026-11-12")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
  });
  it("crosses month and year boundaries", () => {
    expect(weekRange("2027-01-01")).toEqual({ start: "2026-12-28", end: "2027-01-03" });
    expect(weekRange("2026-03-01")).toEqual({ start: "2026-02-23", end: "2026-03-01" });
  });
});

describe("weeklySummary", () => {
  const today = "2026-11-15";
  const submissions = [
    { day: "2026-11-10", lessonIndex: 0, recordingDuration: 60 },
    { day: "2026-11-11", lessonIndex: 0, recordingDuration: 60 }, // same lesson again
    { day: "2026-11-12", lessonIndex: 1, recordingDuration: 5 }, // too short, does not count
    { day: "2026-11-02", lessonIndex: 2, recordingDuration: 60 }, // last week
  ];
  it("counts only this week", () => {
    const s = weeklySummary({ today, days: ["2026-11-02", "2026-11-10", "2026-11-11", "2026-11-14"], submissions, streak: 3 });
    expect(s.activeDays).toBe(3);
    expect(s.lessons).toBe(1);
    expect(s.streak).toBe(3);
  });
  it("marks which weekdays were active, Monday first", () => {
    const s = weeklySummary({ today, days: ["2026-11-10", "2026-11-11", "2026-11-14", "2026-11-02"], submissions: [] });
    expect(s.dayFlags).toEqual([false, true, true, false, false, true, false]);
  });
  it("starts from zero for an empty week", () => {
    const s = weeklySummary({ today, days: [], submissions: [] });
    expect(s).toMatchObject({ activeDays: 0, lessons: 0, streak: 0 });
  });
});

describe("formatWeekly", () => {
  it("is gentle when nothing happened", () => {
    const text = formatWeekly({ activeDays: 0, lessons: 0, streak: 0 });
    expect(text).toMatch(/quiet week/i);
    expect(text).not.toMatch(/fail|miss|lazy/i);
  });
  it("lists the numbers that exist and skips unknown ones", () => {
    const text = formatWeekly({ activeDays: 4, lessons: 3, reviews: 25, conversations: null, streak: 6, topTag: "tenses" });
    expect(text).toContain("4 days");
    expect(text).toContain("3 lessons");
    expect(text).toContain("25 words");
    expect(text).toContain("6-day streak");
    expect(text).toContain("Verb tenses");
    expect(text).not.toMatch(/conversation/i);
  });
});

describe("weekly goal", () => {
  const today = "2026-11-15"; // Sunday; this week is 2026-11-09..15
  const week = (start, count) => Array.from({ length: count }, (_, i) => {
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });

  it("normalizes the goal and falls back to four days", () => {
    expect(normalizeGoalDays(5)).toBe(5);
    expect(normalizeGoalDays(undefined)).toBe(4);
    expect(normalizeGoalDays(1)).toBe(4);
    expect(normalizeGoalDays(9)).toBe(4);
    expect(normalizeGoalDays("5")).toBe(5);
  });

  it("measures this week against the goal", () => {
    expect(weeklyGoalProgress({ days: week("2026-11-09", 3), goalDays: 4, today })).toEqual({ done: 3, target: 4, met: false });
    expect(weeklyGoalProgress({ days: week("2026-11-09", 4), goalDays: 4, today }).met).toBe(true);
    expect(weeklyGoalProgress({ days: [], today })).toEqual({ done: 0, target: 4, met: false });
  });

  it("counts consecutive weeks that reached the goal", () => {
    const days = [...week("2026-10-26", 4), ...week("2026-11-02", 5)]; // two past weeks met
    expect(weeklyStreak(days, 4, today)).toBe(2);
  });
  it("lets the current week count only when it is already met, and never break the streak while it runs", () => {
    const past = [...week("2026-10-26", 4), ...week("2026-11-02", 5)];
    expect(weeklyStreak([...past, ...week("2026-11-09", 4)], 4, today)).toBe(3);
    expect(weeklyStreak([...past, ...week("2026-11-09", 1)], 4, today)).toBe(2);
  });
  it("stops at a week that missed the goal and handles no data", () => {
    const days = [...week("2026-10-19", 4), ...week("2026-10-26", 2), ...week("2026-11-02", 4)];
    expect(weeklyStreak(days, 4, today)).toBe(1);
    expect(weeklyStreak([], 4, today)).toBe(0);
  });
});
