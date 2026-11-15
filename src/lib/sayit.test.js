import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import { pickSayItWords } from "./sayit.js";

const pool = lessons[0].words;
const seeded = () => {
  let s = 7;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

describe("pickSayItWords", () => {
  it("returns up to n different words from the pool", () => {
    const picked = pickSayItWords(pool, 4, seeded());
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((w) => w.term)).size).toBe(4);
    picked.forEach((w) => expect(pool.map((p) => p.term)).toContain(w.term));
  });
  it("copes with a small or empty pool", () => {
    expect(pickSayItWords(pool.slice(0, 2), 5)).toHaveLength(2);
    expect(pickSayItWords([], 5)).toEqual([]);
  });
  it("only offers words that have a recording", () => {
    const withoutAudio = [{ term: "zzzz-no-recording" }, ...pool.slice(0, 3)];
    expect(pickSayItWords(withoutAudio, 10).map((w) => w.term)).not.toContain("zzzz-no-recording");
  });
});
