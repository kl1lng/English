import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import { recommendFocus } from "./focus.js";

describe("recommendFocus", () => {
  it("needs at least three mistakes of one kind", () => {
    expect(recommendFocus([{ tag: "tenses", count: 2 }], [0, 1], lessons)).toBeNull();
    expect(recommendFocus([], [], lessons)).toBeNull();
  });

  it("picks the most frequent tag and finds completed lessons that practise it", () => {
    const r = recommendFocus([{ tag: "tenses", count: 5 }, { tag: "articles", count: 3 }], [0, 1, 2, 3, 4, 5, 6, 7], lessons);
    expect(r.tag).toBe("tenses");
    expect(r.count).toBe(5);
    expect(r.lessonIndexes.length).toBeGreaterThan(0);
    r.lessonIndexes.forEach((i) => expect([0, 1, 2, 3, 4, 5, 6, 7]).toContain(i));
  });

  it("never recommends the other tag and falls through to the next one", () => {
    const r = recommendFocus([{ tag: "other", count: 9 }, { tag: "articles", count: 4 }], [0], lessons);
    expect(r.tag).toBe("articles");
    expect(recommendFocus([{ tag: "other", count: 9 }], [0], lessons)).toBeNull();
  });

  it("still gives a tag with no matching lessons (articles have no lesson topic)", () => {
    expect(recommendFocus([{ tag: "articles", count: 3 }], [0, 1], lessons).lessonIndexes).toEqual([]);
  });
});
