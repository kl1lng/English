import { lessons as raw } from "./lessons/kazakhstan-30.js";
import overrides from "./data/kk-overrides.js";
import { applyKkToLessons } from "./lib/kk.js";

// The lessons with the reviewed Kazakh translations applied (see scripts/kk-review.mjs).
export const lessons = applyKkToLessons(raw, overrides);
