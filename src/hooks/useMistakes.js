import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeTag } from "../data/mistake-tags.js";
import { dedupeMistakes, mistakeStats } from "../lib/mistakes.js";

const demoKey = "speakkaz:mistakes:demo";
const FIELDS = "tag, original, corrected, source, lesson_index, created_at";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(demoKey)) || [];
  } catch {
    return [];
  }
}
function writeLocal(items) {
  try {
    localStorage.setItem(demoKey, JSON.stringify(items.slice(-300)));
  } catch {
    /* storage can be blocked */
  }
}

// The learner's collected grammar mistakes (table learner_mistakes; localStorage without an account).
// status: "loading" | "ready" | "unavailable" (table not created yet).
export function useMistakes({ supabase, userId }) {
  const [status, setStatus] = useState("loading");
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    if (!supabase || !userId) {
      setItems(readLocal());
      setStatus("ready");
      return;
    }
    supabase
      .from("learner_mistakes")
      .select(FIELDS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setStatus("unavailable");
        setItems(data || []);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Adds corrections ({ original, corrected, tag }) that are new. Returns the added ones.
  const add = useCallback(
    (corrections, source, lessonIndex = null) => {
      if (status !== "ready" || !Array.isArray(corrections) || !corrections.length) return [];
      const fresh = dedupeMistakes(items, corrections);
      if (!fresh.length) return [];
      const now = new Date().toISOString();
      const rows = fresh.map((c) => ({
        tag: normalizeTag(c.tag),
        original: c.original,
        corrected: c.corrected,
        source,
        lesson_index: lessonIndex,
        created_at: now,
      }));
      const next = [...rows, ...items];
      setItems(next);
      if (!supabase || !userId) writeLocal(next);
      else
        supabase
          .from("learner_mistakes")
          .upsert(rows.map((r) => ({ user_id: userId, ...r })), { onConflict: "user_id,original,corrected", ignoreDuplicates: true })
          .then(() => {});
      return rows;
    },
    [status, items, supabase, userId],
  );

  const stats = useMemo(() => mistakeStats(items), [items]);
  return { status, items, add, stats };
}
