import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import { buildChoices, makeCloze } from "./cloze.js";
import { buildWordIndex, customKey, deckKeysForLessons } from "./deck.js";
import { newCard, pickSession, reviewRow, Rating, wordKey, dueCount } from "./srs.js";

const now = new Date("2026-11-14T10:00:00Z");

describe("srs", () => {
  it("a new card is due immediately and not mutated by review", () => {
    const row = newCard(now);
    const copy = { ...row };
    reviewRow(row, Rating.Good, now);
    expect(row).toEqual(copy);
    expect(new Date(row.due) <= now).toBe(true);
  });
  it("Again comes back sooner than Easy", () => {
    const row = newCard(now);
    const again = reviewRow(row, Rating.Again, now);
    const easy = reviewRow(row, Rating.Easy, now);
    expect(new Date(again.due) < new Date(easy.due)).toBe(true);
  });
  it("a Good review at the due time pushes the next review further out", () => {
    const row = reviewRow(newCard(now), Rating.Good, now);
    const next = new Date(row.due);
    const after = reviewRow(row, Rating.Good, next);
    expect(new Date(after.due) > next).toBe(true);
    expect(after.reps).toBe(2);
  });
  it("wordKey matches the audio file naming", () => {
    expect(wordKey(" Local Community ")).toBe("local-community");
  });
});

describe("pickSession", () => {
  const reviewed = (due) => ({
    ...reviewRow(newCard(now), Rating.Good, now),
    due,
    word_key: due,
  });
  it("puts overdue reviews first, then new cards, within limits", () => {
    const rows = [
      { ...newCard(now), word_key: "n1" },
      { ...newCard(now), word_key: "n2" },
      reviewed("2026-11-10T00:00:00.000Z"),
      reviewed("2026-11-12T00:00:00.000Z"),
      reviewed("2026-12-30T00:00:00.000Z"),
    ];
    const s = pickSession(rows, now, { size: 3 });
    expect(s.map((r) => r.word_key)).toEqual([
      "2026-11-10T00:00:00.000Z",
      "2026-11-12T00:00:00.000Z",
      "n1",
    ]);
    expect(pickSession(rows, now, { maxNew: 0 }).length).toBe(2);
    expect(dueCount(rows, now)).toBe(4);
  });
});

describe("customKey", () => {
  it("makes a stable short key for a phrase", () => {
    expect(customKey("It is famous for…")).toBe("c:it-is-famous-for");
    expect(customKey("  I would RECOMMEND  ")).toBe("c:i-would-recommend");
    expect(customKey("???")).toBe("");
    expect(customKey("x".repeat(200)).length).toBeLessThanOrEqual(62);
  });
});

describe("deck", () => {
  it("dedupes repeated words across lessons", () => {
    const index = buildWordIndex();
    expect(index.size).toBe(153);
    expect(index.get("preserve").lessonIndex).toBe(3);
  });
  it("builds the deck for completed lessons only", () => {
    const keys = deckKeysForLessons([0]);
    expect(keys.length).toBe(6);
    expect(keys).toContain("diverse");
    expect(deckKeysForLessons([])).toEqual([]);
  });
});

describe("cloze", () => {
  it("blanks the word and inflected forms", () => {
    expect(makeCloze("Kazakhstan has diverse landscapes.", "diverse")).toEqual({
      text: "Kazakhstan has _____ landscapes.",
      answer: "diverse",
    });
    expect(makeCloze("Landscapes change fast.", "landscape").text).toBe("_____ change fast.");
  });
  it("returns null when the word is not in the sentence", () => {
    expect(makeCloze("Nothing here.", "heritage")).toBeNull();
  });
  it("works for most lesson examples", () => {
    const withBlank = lessons
      .flatMap((l) => l.words)
      .filter((w) => makeCloze(w.example, w.term));
    expect(withBlank.length).toBeGreaterThan(150);
  });
  it("builds four unique choices including the answer", () => {
    const pool = lessons[0].words.map((w) => w.term);
    const options = buildChoices("diverse", pool, () => 0.3);
    expect(options.length).toBe(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain("diverse");
  });
});
