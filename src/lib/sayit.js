import { hasRecording } from "./audio.js";

// Words for the "Say it" self-check: random, different, and only words that have a recording.
export function pickSayItWords(pool, n = 5, rng = Math.random) {
  const usable = pool.filter((w) => hasRecording(w.term));
  const out = [...usable];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}
