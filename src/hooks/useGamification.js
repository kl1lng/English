import { useCallback, useEffect, useRef, useState } from "react";
import { awardFor } from "../lib/xp.js";
import { dayKey } from "../lib/time.js";

const demoKey = "speakkaz:stats:demo";

export const emptyStats = {
  xp: 0,
  freezes: 0,
  badges: [],
  dailyGoal: "lesson",
  tz: "Asia/Oral",
  extra: {
    freezeDays: [],
    lastFreezeStreak: 0,
    daily: null,
    reviewsTotal: 0,
    streakXpDay: "",
  },
};

function readDemo() {
  try {
    return JSON.parse(localStorage.getItem(demoKey)) || null;
  } catch {
    return null;
  }
}

function fromRow(row) {
  return {
    xp: row.xp ?? 0,
    freezes: row.freezes ?? 0,
    badges: row.badges || [],
    dailyGoal: row.daily_goal || "lesson",
    tz: row.tz || "Asia/Oral",
    extra: { ...emptyStats.extra, ...(row.extra || {}) },
  };
}

function toRow(userId, s) {
  return {
    user_id: userId,
    xp: s.xp,
    freezes: s.freezes,
    badges: s.badges,
    daily_goal: s.dailyGoal,
    tz: s.tz,
    extra: s.extra,
    updated_at: new Date().toISOString(),
  };
}

// XP, badges, freezes and the daily goal. Signed-in learners are stored in Supabase
// (player_stats); without accounts it uses localStorage.
// status: "loading" | "ready" | "unavailable" (table not created yet).
export function useGamification({ supabase, userId }) {
  const [status, setStatus] = useState("loading");
  const [stats, setStats] = useState(emptyStats);
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loaded.current = false;
    setStatus("loading");
    if (!supabase || !userId) {
      setStats({ ...emptyStats, ...(readDemo() || {}) });
      loaded.current = true;
      setStatus("ready");
      return;
    }
    supabase
      .from("player_stats")
      .select("xp, freezes, badges, daily_goal, tz, extra")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("unavailable");
          return;
        }
        setStats(data ? fromRow(data) : emptyStats);
        loaded.current = true;
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  // Save shortly after the last change.
  useEffect(() => {
    if (!loaded.current || status !== "ready") return;
    const timer = setTimeout(async () => {
      if (!supabase || !userId) {
        try {
          localStorage.setItem(demoKey, JSON.stringify(stats));
        } catch {
          /* storage can be blocked */
        }
        return;
      }
      const { error } = await supabase
        .from("player_stats")
        .upsert(toRow(userId, stats), { onConflict: "user_id" });
      setSaveError(Boolean(error));
    }, 600);
    return () => clearTimeout(timer);
  }, [stats, status, supabase, userId]);

  const award = useCallback((event) => {
    setStats((s) => {
      const today = dayKey(new Date(), s.tz);
      const { xp, daily } = awardFor(event, s.extra.daily, today);
      return {
        ...s,
        xp: s.xp + xp,
        extra: {
          ...s.extra,
          daily,
          reviewsTotal: s.extra.reviewsTotal + (event.type === "review" ? 1 : 0),
          dialoguesTotal: (s.extra.dialoguesTotal || 0) + (event.type === "dialogue" ? 1 : 0),
        },
      };
    });
  }, []);

  const patch = useCallback((fn) => setStats((s) => fn(s)), []);

  return {
    status,
    stats,
    saveError,
    award,
    setGoal: (dailyGoal) => patch((s) => ({ ...s, dailyGoal })),
    applyFreeze: ({ freezes, freezeDays }) =>
      patch((s) => ({ ...s, freezes, extra: { ...s.extra, freezeDays } })),
    grantFreeze: ({ freezes, lastGrantedAt }) =>
      patch((s) => ({
        ...s,
        freezes,
        extra: { ...s.extra, lastFreezeStreak: lastGrantedAt },
      })),
    unlockBadges: (ids) =>
      patch((s) => ({ ...s, badges: [...new Set([...s.badges, ...ids])] })),
    markStreakXpDay: (day) =>
      patch((s) => ({ ...s, extra: { ...s.extra, streakXpDay: day } })),
  };
}
