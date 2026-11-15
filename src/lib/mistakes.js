import { MISTAKE_TAGS } from "../data/mistake-tags.js";

const norm = (text) => String(text).trim().toLowerCase().replace(/\s+/g, " ");

// Counts mistakes per tag over the last `days` days. Most frequent first; ties follow MISTAKE_TAGS order.
export function mistakeStats(items, now = new Date(), days = 30) {
  const since = now.getTime() - days * 86400000;
  const counts = new Map();
  for (const item of items) {
    if (new Date(item.created_at).getTime() < since) continue;
    counts.set(item.tag, (counts.get(item.tag) || 0) + 1);
  }
  const order = (tag) => {
    const i = MISTAKE_TAGS.indexOf(tag);
    return i < 0 ? MISTAKE_TAGS.length : i;
  };
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || order(a.tag) - order(b.tag));
}

// "m:" + 8 hex characters (FNV-1a) for one mistake pair; the same pair always gives the same key.
export function mistakeKey(original, corrected) {
  const text = `${norm(original)}\u0000${norm(corrected)}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `m:${hash.toString(16).padStart(8, "0")}`;
}

// Pairs from `incoming` that are not in `stored` and not repeated inside the batch.
export function dedupeMistakes(stored, incoming) {
  const seen = new Set(stored.map((m) => mistakeKey(m.original, m.corrected)));
  const fresh = [];
  for (const m of incoming) {
    const key = mistakeKey(m.original, m.corrected);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(m);
  }
  return fresh;
}
