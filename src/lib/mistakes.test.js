import { describe, expect, it } from "vitest";
import { dedupeMistakes, mistakeKey, mistakeStats } from "./mistakes.js";

const now = new Date("2026-11-15T12:00:00Z");
const day = (n) => new Date(now.getTime() - n * 86400000).toISOString();
const item = (tag, daysAgo, original = "x") => ({ tag, original, corrected: "y", created_at: day(daysAgo) });

describe("mistakeStats", () => {
  it("counts the last 30 days by tag, most frequent first", () => {
    const items = [item("tenses", 1), item("articles", 2), item("tenses", 3), item("tenses", 4), item("tenses", 40), item("articles", 5)];
    expect(mistakeStats(items, now)).toEqual([
      { tag: "tenses", count: 3 },
      { tag: "articles", count: 2 },
    ]);
  });
  it("returns an empty list for no mistakes and respects the window", () => {
    expect(mistakeStats([], now)).toEqual([]);
    expect(mistakeStats([item("tenses", 10)], now, 7)).toEqual([]);
  });
  it("puts ties in the fixed tag order", () => {
    const stats = mistakeStats([item("prepositions", 1), item("articles", 1)], now);
    expect(stats.map((s) => s.tag)).toEqual(["articles", "prepositions"]);
  });
});

describe("mistakeKey", () => {
  it("is stable, short and different for different pairs", () => {
    const a = mistakeKey("I goed", "I went");
    expect(a).toBe(mistakeKey("I goed", "I went"));
    expect(a).toMatch(/^m:[0-9a-f]{8}$/);
    expect(a).not.toBe(mistakeKey("I goed", "I have gone"));
    expect(mistakeKey("  I Goed ", "I went")).toBe(a);
  });
});

describe("dedupeMistakes", () => {
  it("returns only pairs that are not stored yet and not repeated in the batch", () => {
    const stored = [{ original: "I goed", corrected: "I went" }];
    const incoming = [
      { original: "i goed", corrected: "I went" },
      { original: "a apple", corrected: "an apple" },
      { original: "a apple", corrected: "an apple" },
    ];
    expect(dedupeMistakes(stored, incoming)).toEqual([{ original: "a apple", corrected: "an apple" }]);
  });
});
