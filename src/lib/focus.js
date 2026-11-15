import { TAG_TO_GRAMMAR } from "../data/grammar-tags.js";

const MIN_MISTAKES = 3;

// Suggests one thing to practise today from the learner's mistake statistics.
// stats: [{ tag, count }] most frequent first. Returns null when there is not enough data.
export function recommendFocus(stats, completedIndexes, lessons) {
  const top = stats.find((s) => s.tag !== "other" && s.count >= MIN_MISTAKES);
  if (!top) return null;
  const topics = TAG_TO_GRAMMAR[top.tag] || [];
  const done = new Set(completedIndexes);
  const lessonIndexes = lessons
    .map((lesson, i) => ({ lesson, i }))
    .filter(({ lesson, i }) => done.has(i) && (lesson.grammarFocus || []).some((g) => topics.includes(g)))
    .map(({ i }) => i);
  return { tag: top.tag, count: top.count, lessonIndexes };
}
