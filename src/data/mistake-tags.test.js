import { describe, expect, it } from "vitest";
import { MISTAKE_TAGS, normalizeTag } from "./mistake-tags.js";

describe("normalizeTag", () => {
  it("accepts the known tags in any letter case", () => {
    expect(normalizeTag("Tenses")).toBe("tenses");
    expect(normalizeTag(" articles ")).toBe("articles");
    MISTAKE_TAGS.forEach((tag) => expect(normalizeTag(tag)).toBe(tag));
  });
  it("falls back to other for anything else", () => {
    expect(normalizeTag("???")).toBe("other");
    expect(normalizeTag(undefined)).toBe("other");
    expect(normalizeTag(42)).toBe("other");
  });
  it("lists the eight tags", () => {
    expect(MISTAKE_TAGS).toEqual(["articles", "tenses", "prepositions", "agreement", "word-order", "word-choice", "plurals", "other"]);
  });
});
