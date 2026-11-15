import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import { applyKkToLessons, exportKkRows, parseCsv, toCsv, validateKkRows } from "./kk.js";

describe("exportKkRows", () => {
  it("lists every unique word once with its meanings", () => {
    const rows = exportKkRows(lessons);
    expect(rows).toHaveLength(153);
    expect(rows[0]).toMatchObject({ key: "diverse", term: "diverse", kk: "алуан түрлі", ru: "разнообразный" });
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
  });
});

describe("csv", () => {
  it("round-trips commas, quotes and line breaks", () => {
    const rows = [{ key: "a", term: "he said, \"hi\"", kk: "бір\nекі", ru: "x", example: "y" }];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("validateKkRows", () => {
  const good = exportKkRows(lessons);
  it("accepts the untouched export and a corrected translation", () => {
    expect(validateKkRows(good, lessons).ok).toBe(true);
    const edited = good.map((r, i) => (i === 0 ? { ...r, kk: "алуан түрлі (түзетілген)" } : r));
    expect(validateKkRows(edited, lessons)).toEqual({ ok: true, errors: [] });
  });
  it("rejects empty translations, unknown words and changes to other columns", () => {
    const bad = good.map((r, i) => (i === 0 ? { ...r, kk: "  " } : i === 2 ? { ...r, term: "changed" } : i === 3 ? { ...r, ru: "изменено" } : r));
    bad.push({ ...good[1], key: "not-a-word" });
    const { ok, errors } = validateKkRows(bad, lessons);
    expect(ok).toBe(false);
    expect(errors).toHaveLength(4);
  });
  it("rejects a file that is missing words", () => {
    expect(validateKkRows(good.slice(1), lessons).ok).toBe(false);
  });
});

describe("applyKkToLessons", () => {
  it("replaces only the Kazakh meaning of the listed words and keeps everything else", () => {
    const out = applyKkToLessons(lessons, { diverse: "жаңа аударма" });
    const word = out[0].words.find((w) => w.term === "diverse");
    expect(word.kk).toBe("жаңа аударма");
    expect(word.ru).toBe("разнообразный");
    expect(out[0].words.find((w) => w.term === "vast")).toBe(lessons[0].words.find((w) => w.term === "vast"));
    // the same word in a later lesson gets the same text
    const later = out.flatMap((l) => l.words).filter((w) => w.term === "diverse");
    later.forEach((w) => expect(w.kk).toBe("жаңа аударма"));
  });
  it("returns the lessons unchanged when there are no overrides", () => {
    expect(applyKkToLessons(lessons, {})).toBe(lessons);
  });
});
