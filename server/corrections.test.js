import { describe, expect, it } from "vitest";
import { sanitizeCorrections } from "./corrections.js";

describe("sanitizeCorrections", () => {
  const said = "Yesterday I goed to the market and buy a apple";
  it("keeps corrections that quote the learner and normalizes the tag", () => {
    const result = sanitizeCorrections(
      [
        { original: "I goed", corrected: "I went", tag: "Tenses" },
        { original: "a apple", corrected: "an apple", tag: "nonsense" },
        { original: "never said", corrected: "x", tag: "tenses" },
      ],
      said,
      3,
    );
    expect(result).toEqual([
      { original: "I goed", corrected: "I went", tag: "tenses" },
      { original: "a apple", corrected: "an apple", tag: "other" },
    ]);
  });
  it("applies the limit, drops bad shapes and over-long text", () => {
    const many = Array.from({ length: 5 }, () => ({ original: "I goed", corrected: "I went" }));
    expect(sanitizeCorrections(many, said, 2)).toHaveLength(2);
    expect(sanitizeCorrections([null, { original: 1, corrected: "x" }, { original: "I goed", corrected: "y".repeat(300) }], said, 3)).toEqual([]);
    expect(sanitizeCorrections("not a list", said, 3)).toEqual([]);
  });
});
