import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deckKeysForLessons } from "../lib/deck.js";
import { newCard, reviewRow, State } from "../lib/srs.js";
import { dayKey } from "../lib/time.js";

const demoKey = "speakkaz:deck:demo";
const pendingKey = (userId) => `speakkaz:pending:${userId}`;

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be blocked; the deck still works for this visit */
  }
}

const CARD_FIELDS =
  "word_key, source, due, stability, difficulty, scheduled_days, learning_steps, reps, lapses, state, last_review";

// The learner's word deck (spaced repetition). Signed-in learners are stored in
// Supabase (table word_cards); without accounts the deck lives in localStorage.
// status: "loading" | "ready" | "unavailable" (table missing / not set up yet).
export function useWordCards({ supabase, userId, completedIndexes }) {
  const [status, setStatus] = useState("loading");
  const [byKey, setByKey] = useState({});
  const [saveError, setSaveError] = useState(false);
  const ready = useRef(false);

  const persist = useCallback(
    async (cards, logs) => {
      if (!supabase || !userId) {
        setByKey((current) => {
          writeJson(demoKey, current);
          return current;
        });
        return;
      }
      const ops = [];
      if (cards.length)
        ops.push({
          table: "word_cards",
          rows: cards.map((c) => ({ user_id: userId, ...c })),
        });
      if (logs.length)
        ops.push({
          table: "review_log",
          rows: logs.map((l) => ({ user_id: userId, ...l })),
        });
      for (const op of ops) {
        const query =
          op.table === "word_cards"
            ? supabase.from(op.table).upsert(op.rows, { onConflict: "user_id,word_key" })
            : supabase.from(op.table).insert(op.rows);
        const { error } = await query;
        if (error) {
          writeJson(pendingKey(userId), [...readJson(pendingKey(userId), []), op]);
          setSaveError(true);
        }
      }
    },
    [supabase, userId],
  );

  useEffect(() => {
    let cancelled = false;
    ready.current = false;
    setStatus("loading");
    if (!supabase || !userId) {
      setByKey(readJson(demoKey, {}));
      ready.current = true;
      setStatus("ready");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("word_cards")
        .select(CARD_FIELDS)
        .eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        setStatus("unavailable");
        return;
      }
      setByKey(Object.fromEntries(data.map((r) => [r.word_key, r])));
      ready.current = true;
      setStatus("ready");
      const pending = readJson(pendingKey(userId), []);
      if (pending.length) {
        localStorage.removeItem(pendingKey(userId));
        for (const op of pending) {
          const query =
            op.table === "word_cards"
              ? supabase.from(op.table).upsert(op.rows, { onConflict: "user_id,word_key" })
              : supabase.from(op.table).insert(op.rows);
          const { error: retryError } = await query;
          if (retryError)
            writeJson(pendingKey(userId), [...readJson(pendingKey(userId), []), op]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Add the words of completed lessons to the deck (idempotent).
  const completedKey = completedIndexes.join(",");
  useEffect(() => {
    if (status !== "ready" || !ready.current) return;
    const wanted = deckKeysForLessons(completedIndexes);
    const missing = wanted.filter((key) => !byKey[key]);
    if (!missing.length) return;
    const now = new Date();
    const created = missing.map((key) => ({
      word_key: key,
      source: "lesson",
      ...newCard(now),
    }));
    setByKey((current) => {
      const next = { ...current };
      created.forEach((c) => (next[c.word_key] = next[c.word_key] || c));
      if (!supabase || !userId) writeJson(demoKey, next);
      return next;
    });
    if (supabase && userId) persist(created, []);
  }, [status, completedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReview = useCallback(
    (key, rating, mode = "flip") => {
      const current = byKey[key];
      if (!current) return;
      const now = new Date();
      const updated = { ...current, ...reviewRow(current, rating, now) };
      const next = { ...byKey, [key]: updated };
      setByKey(next);
      if (!supabase || !userId) {
        writeJson(demoKey, next);
        return;
      }
      persist(
        [updated],
        [
          {
            word_key: key,
            rating,
            state_before: current.state,
            mode,
            reviewed_at: now.toISOString(),
          },
        ],
      );
    },
    [byKey, supabase, userId, persist],
  );

  const rows = useMemo(() => Object.values(byKey), [byKey]);
  const today = dayKey();
  const doneToday = useMemo(() => {
    let doneNew = 0;
    let doneReviews = 0;
    rows.forEach((r) => {
      if (!r.last_review || dayKey(new Date(r.last_review)) !== today) return;
      if (r.reps <= 1 && r.state !== State.New) doneNew += 1;
      else doneReviews += 1;
    });
    return { doneNew, doneReviews };
  }, [rows, today]);

  return { status, rows, submitReview, saveError, doneToday };
}
