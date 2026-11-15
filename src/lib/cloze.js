import { tokenMatches } from "../feedback.js";

const APOSTROPHES = /[’']/g;

// Replaces the studied word in its example sentence with a blank.
// Returns null when the sentence does not contain the word (use a flip card then).
export function makeCloze(example, term) {
  const text = String(example);
  const target = term.toLocaleLowerCase("en").replace(APOSTROPHES, "");
  if (!target) return null;
  if (target.includes(" ") || target.includes("-")) {
    const at = text.toLocaleLowerCase("en").indexOf(term.toLocaleLowerCase("en"));
    if (at < 0) return null;
    return {
      text: text.slice(0, at) + "_____" + text.slice(at + term.length),
      answer: text.slice(at, at + term.length),
    };
  }
  const re = /[\p{L}\p{N}’']+/gu;
  let match;
  while ((match = re.exec(text))) {
    const spoken = match[0].toLocaleLowerCase("en").replace(APOSTROPHES, "");
    if (tokenMatches(target, spoken)) {
      return {
        text:
          text.slice(0, match.index) +
          "_____" +
          text.slice(match.index + match[0].length),
        answer: match[0],
      };
    }
  }
  return null;
}

// Four options: the answer plus three distractors from `pool` (other words).
// `rng` is injectable for tests.
export function buildChoices(answer, pool, rng = Math.random) {
  const key = answer.toLocaleLowerCase("en");
  const others = [...new Set(pool.map((w) => w.toLocaleLowerCase("en")))].filter(
    (w) => w !== key && !tokenMatches(w, key) && !tokenMatches(key, w),
  );
  const picked = [];
  const rest = [...others];
  while (picked.length < 3 && rest.length)
    picked.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  const options = [...picked, answer];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}
