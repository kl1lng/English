import { describe, expect, it } from "vitest";
import { addDays, dayKey } from "./time.js";
import { advanceStreak } from "./streak.js";

describe("dayKey", () => {
  it("uses the given time zone for the date", () => {
    const instant = new Date("2026-03-01T22:30:00Z");
    expect(dayKey(instant, "UTC")).toBe("2026-03-01");
    expect(dayKey(instant, "Asia/Oral")).toBe("2026-03-02"); // UTC+5
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("advanceStreak", () => {
  const today = "2026-11-14";
  it("starts at 1 for a first activity", () => {
    expect(advanceStreak({ streak: 0, days: [], today })).toBe(1);
  });
  it("adds one after an active yesterday", () => {
    expect(advanceStreak({ streak: 4, days: ["2026-11-13"], today })).toBe(5);
  });
  it("restarts after a missed day", () => {
    expect(advanceStreak({ streak: 4, days: ["2026-11-12"], today })).toBe(1);
  });
  it("keeps the streak on a second activity the same day", () => {
    expect(advanceStreak({ streak: 5, days: ["2026-11-13", today], today })).toBe(5);
  });
  it("works across a month boundary", () => {
    expect(advanceStreak({ streak: 2, days: ["2026-10-31"], today: "2026-11-01" })).toBe(3);
  });
});
