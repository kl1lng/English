// Badge definitions. `test` receives the learner's current statistics.
// ctx: { completedCount, streak, bestStreak, wordsLearned, reviewsTotal, level }
export const BADGES = [
  { id: "first-voice", title: "First voice", text: "Finish your first lesson.", icon: "mic", test: (c) => c.completedCount >= 1 },
  { id: "lessons-5", title: "Five stories", text: "Finish 5 lessons.", icon: "book", test: (c) => c.completedCount >= 5 },
  { id: "lessons-15", title: "Halfway there", text: "Finish 15 lessons.", icon: "compass", test: (c) => c.completedCount >= 15 },
  { id: "lessons-30", title: "Full journey", text: "Finish all 30 lessons.", icon: "trophy", test: (c) => c.completedCount >= 30 },
  { id: "streak-3", title: "Three in a row", text: "Practise 3 days in a row.", icon: "flame", test: (c) => Math.max(c.streak, c.bestStreak) >= 3 },
  { id: "streak-7", title: "A full week", text: "Practise 7 days in a row.", icon: "flame", test: (c) => Math.max(c.streak, c.bestStreak) >= 7 },
  { id: "streak-30", title: "Unstoppable", text: "Practise 30 days in a row.", icon: "crown", test: (c) => Math.max(c.streak, c.bestStreak) >= 30 },
  { id: "first-review", title: "Memory starter", text: "Finish your first word review.", icon: "layers", test: (c) => c.reviewsTotal >= 1 },
  { id: "first-talk", title: "First conversation", text: "Finish a conversation with the speaking partner.", icon: "mic", test: (c) => (c.dialoguesTotal || 0) >= 1 },
  { id: "words-10", title: "Ten words", text: "Learn 10 words.", icon: "sparkles", test: (c) => c.wordsLearned >= 10 },
  { id: "words-100", title: "Word collector", text: "Learn 100 words.", icon: "star", test: (c) => c.wordsLearned >= 100 },
  { id: "level-5", title: "Level 5", text: "Reach level 5.", icon: "award", test: (c) => c.level >= 5 },
];

// Badges that became earned and were not recorded yet.
export function newlyEarned(earnedIds, ctx) {
  const have = new Set(earnedIds);
  return BADGES.filter((b) => !have.has(b.id) && b.test(ctx));
}
