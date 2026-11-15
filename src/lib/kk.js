import { wordKey } from "./srs.js";

// Review of the Kazakh translations: export every word to a table, let a native speaker correct the
// kk column, validate the returned file and apply it as overrides without editing the lesson files.

// One row per unique word (the first lesson that teaches it).
export function exportKkRows(lessons) {
  const seen = new Map();
  for (const lesson of lessons)
    for (const w of lesson.words) {
      const key = wordKey(w.term);
      if (!seen.has(key)) seen.set(key, { key, term: w.term, kk: w.kk, ru: w.ru, example: w.example });
    }
  return [...seen.values()];
}

const COLUMNS = ["key", "term", "kk", "ru", "example"];

const cell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows) =>
  [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n") + "\n";

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const src = String(text).replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  return body.map((r) => Object.fromEntries(header.map((name, i) => [name, r[i] ?? ""])));
}

// Checks a returned table against the lessons. Only the kk column may change.
export function validateKkRows(rows, lessons) {
  const known = new Map(exportKkRows(lessons).map((r) => [r.key, r]));
  const errors = [];
  const seen = new Set();
  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const original = known.get(row.key);
    if (!original) return errors.push(`Line ${line}: unknown word "${row.key}".`);
    seen.add(row.key);
    if (!String(row.kk ?? "").trim()) errors.push(`Line ${line}: the Kazakh translation of "${row.key}" is empty.`);
    if (row.term !== original.term) errors.push(`Line ${line}: the English word of "${row.key}" must not change.`);
    if (row.ru !== original.ru) errors.push(`Line ${line}: the Russian meaning of "${row.key}" must not change.`);
  });
  for (const key of known.keys()) if (!seen.has(key)) errors.push(`Missing word "${key}".`);
  return { ok: errors.length === 0, errors };
}

// Returns lessons whose words carry the reviewed Kazakh text. Untouched words stay the same objects.
export function applyKkToLessons(lessons, overrides) {
  if (!overrides || !Object.keys(overrides).length) return lessons;
  return lessons.map((lesson) => ({
    ...lesson,
    words: lesson.words.map((w) => {
      const text = overrides[wordKey(w.term)];
      return text && text !== w.kk ? { ...w, kk: text } : w;
    }),
  }));
}
