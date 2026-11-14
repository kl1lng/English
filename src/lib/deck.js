import { lessons } from "../lessons.js";
import { wordKey } from "./srs.js";

// All study words keyed by wordKey. A word that appears in several lessons is one
// card (the first lesson that teaches it).
export function buildWordIndex(allLessons = lessons) {
  const index = new Map();
  allLessons.forEach((lesson, lessonIndex) => {
    lesson.words.forEach((w) => {
      const key = wordKey(w.term);
      if (!index.has(key)) index.set(key, { key, lessonIndex, ...w });
    });
  });
  return index;
}

// Key for a custom phrase (from the speaking-partner review): "c:" plus a short slug.
export function customKey(text) {
  const slug = String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug ? `c:${slug}` : "";
}

// Word keys that should be in the deck for the given completed lesson numbers.
export function deckKeysForLessons(completedIndexes, allLessons = lessons) {
  const done = new Set(completedIndexes.map(Number));
  const keys = new Set();
  allLessons.forEach((lesson, i) => {
    if (done.has(i)) lesson.words.forEach((w) => keys.add(wordKey(w.term)));
  });
  return [...keys];
}
