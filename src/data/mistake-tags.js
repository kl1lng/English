// Categories for the learner's mistakes. Shared by the app and the API.
export const MISTAKE_TAGS = [
  "articles",
  "tenses",
  "prepositions",
  "agreement",
  "word-order",
  "word-choice",
  "plurals",
  "other",
];

export const MISTAKE_TAG_LABELS = {
  articles: "Articles (a, an, the)",
  tenses: "Verb tenses",
  prepositions: "Prepositions",
  agreement: "Subject and verb agreement",
  "word-order": "Word order",
  "word-choice": "Word choice",
  plurals: "Plurals",
  other: "Other",
};

export function normalizeTag(tag) {
  const value = typeof tag === "string" ? tag.trim().toLowerCase() : "";
  return MISTAKE_TAGS.includes(value) ? value : "other";
}
