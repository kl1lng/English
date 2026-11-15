import { describe, expect, it } from "vitest";
import { courses } from "../courses.js";
import { makeCloze } from "../lib/cloze.js";
import { wordKey } from "../lib/srs.js";

// Words whose example sentence does not contain the word itself (the fill-the-blank exercise then
// falls back to a flip card). Each entry needs a reason; the list should only shrink.
const NO_BLANK_ALLOWED = {
  // filled in after the first run, see the failing output
};

describe.each(courses)("lessons of $id", (course) => {
  const { lessons } = course;

  it("have unique ids and titles", () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    expect(new Set(lessons.map((l) => l.title)).size).toBe(lessons.length);
  });

  it("each have exactly six different words with all fields", () => {
    const problems = [];
    lessons.forEach((l) => {
      if (l.words.length !== 6) problems.push(`${l.id}: ${l.words.length} words`);
      const keys = l.words.map((w) => wordKey(w.term));
      if (new Set(keys).size !== keys.length) problems.push(`${l.id}: repeated word`);
      l.words.forEach((w) => {
        for (const field of ["term", "kk", "ru", "example"])
          if (!String(w[field] || "").trim()) problems.push(`${l.id}/${w.term}: empty ${field}`);
      });
    });
    expect(problems).toEqual([]);
  });

  it("list the same words as the target vocabulary", () => {
    const problems = lessons
      .filter((l) => JSON.stringify(l.targetVocabulary) !== JSON.stringify(l.words.map((w) => w.term)))
      .map((l) => l.id);
    expect(problems).toEqual([]);
  });

  it("have enough questions and consistent durations", () => {
    const problems = [];
    lessons.forEach((l) => {
      if ((l.questions || []).length < 4) problems.push(`${l.id}: fewer than 4 questions`);
      if (!(l.minimumDurationSeconds > 0 && l.minimumDurationSeconds <= l.recommendedDurationSeconds && l.recommendedDurationSeconds <= l.maxDurationSeconds))
        problems.push(`${l.id}: durations out of order`);
      if (!(l.grammarFocus || []).length) problems.push(`${l.id}: no grammar focus`);
    });
    expect(problems).toEqual([]);
  });

  it("have example sentences that contain their word (so the blank exercise works)", () => {
    const problems = [];
    lessons.forEach((l) =>
      l.words.forEach((w) => {
        if (!makeCloze(w.example, w.term) && !NO_BLANK_ALLOWED[`${l.id}/${w.term}`]) problems.push(`${l.id}/${w.term}: "${w.example}"`);
      }),
    );
    expect(problems).toEqual([]);
  });
});

describe("courses together", () => {
  it("never share a lesson id", () => {
    const ids = courses.flatMap((c) => c.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
