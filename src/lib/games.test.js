import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import { isOrderCorrect, makeOrder, makePairs } from "./games.js";

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe("makePairs", () => {
  const words = lessons.flatMap((l) => l.words);
  it("returns n pairs with unique meanings", () => {
    const pairs = makePairs(words, 5, seeded());
    expect(pairs.length).toBe(5);
    expect(new Set(pairs.map((p) => p.meaning.toLowerCase())).size).toBe(5);
  });
  it("returns fewer pairs when there are not enough words", () => {
    expect(makePairs(words.slice(0, 2), 5, seeded()).length).toBe(2);
    expect(makePairs([], 5)).toEqual([]);
  });
  it("skips words without a meaning in the chosen language", () => {
    expect(makePairs([{ term: "a", ru: "" }], 5).length).toBe(0);
  });
});

describe("makeOrder", () => {
  it("shuffles a sentence into chips and checks the answer", () => {
    const sentence = "Vast steppes stretch across the country.";
    const order = makeOrder(sentence, seeded(7));
    expect(order.chips.length).toBe(6);
    expect(order.chips.map((c) => c.text).join(" ")).not.toBe(sentence);
    const ordered = [...order.chips].sort((a, b) => a.id - b.id).map((c) => c.text);
    expect(isOrderCorrect(order.answer, ordered)).toBe(true);
    expect(isOrderCorrect(order.answer, [...ordered].reverse())).toBe(false);
  });
  it("rejects sentences that are too short or too long", () => {
    expect(makeOrder("Too short here")).toBeNull();
    expect(makeOrder("one two three four five six seven eight nine ten eleven twelve thirteen")).toBeNull();
  });
  it("gives a usable exercise for most lesson examples", () => {
    const usable = lessons.flatMap((l) => l.words).filter((w) => makeOrder(w.example));
    expect(usable.length).toBeGreaterThan(120);
  });
});
