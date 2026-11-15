import { normalizeTag } from "../src/data/mistake-tags.js";

// Keeps only corrections that quote words the learner really said, with a valid tag.
export function sanitizeCorrections(corrections, spokenText, max = 2) {
  if (!Array.isArray(corrections)) return [];
  const said = String(spokenText || "").toLocaleLowerCase();
  return corrections
    .filter(
      (c) =>
        c &&
        typeof c.original === "string" &&
        typeof c.corrected === "string" &&
        c.original.length > 0 &&
        c.original.length <= 180 &&
        c.corrected.length <= 220 &&
        said.includes(c.original.toLocaleLowerCase()),
    )
    .slice(0, max)
    .map((c) => ({ original: c.original.trim(), corrected: c.corrected.trim(), tag: normalizeTag(c.tag) }));
}
