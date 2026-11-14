// Generators for the mini-games. `rng` is injectable so tests are deterministic.
function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pairs: n words with their Russian meaning (Kazakh as an alternative language).
// Skips words whose meanings are identical, so every pair has one right match.
export function makePairs(words, n = 5, rng = Math.random, lang = "ru") {
  const seen = new Set();
  const usable = words.filter((w) => {
    const meaning = String(w[lang] || "").trim();
    if (!meaning || seen.has(meaning.toLowerCase())) return false;
    seen.add(meaning.toLowerCase());
    return true;
  });
  return shuffle(usable, rng)
    .slice(0, n)
    .map((w) => ({ id: w.key || w.term, term: w.term, meaning: w[lang] }));
}

const WORD = /[^\s]+/g;

// Sentence builder: the example sentence split into word chips in random order.
// Returns null for sentences that are too short or too long to be a good exercise.
export function makeOrder(example, rng = Math.random) {
  const tokens = String(example).match(WORD) || [];
  if (tokens.length < 4 || tokens.length > 12) return null;
  let shuffled = shuffle(tokens.map((text, i) => ({ id: i, text })), rng);
  // Never hand out the sentence already in the right order.
  if (shuffled.every((chip, i) => chip.id === i)) shuffled = [...shuffled].reverse();
  return { answer: tokens, chips: shuffled };
}

export const isOrderCorrect = (answer, picked) =>
  answer.length === picked.length &&
  answer.every((token, i) => token === picked[i]);
