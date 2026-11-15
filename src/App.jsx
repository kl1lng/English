import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCourse } from "./courses.js";
import { usePwa } from "./hooks/usePwa.js";
import { weekRange, weeklyStreak, weeklySummary } from "./lib/weekly.js";
import { recommendFocus } from "./lib/focus.js";
import { useMistakes } from "./hooks/useMistakes.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import { useOnline } from "./hooks/useOnline.js";
import ThemeToggle from "./components/ThemeToggle.jsx";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Flame,
  Heart,
  Headphones,
  Layers,
  Home,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  Trophy,
  TreePine,
  Puzzle,
  X,
} from "lucide-react";
import { lessons } from "./lessons.js";
import { createNoTranscriptFeedback } from "./feedback.js";
import { speakWord } from "./lib/audio.js";
import { supabase, supabaseReady } from "./supabase.js";
import { advanceStreak, earnFreeze, settleFreeze } from "./lib/streak.js";
import { countsForStreak, levelFor, normalizeDaily } from "./lib/xp.js";
import { newlyEarned } from "./lib/badges.js";
import { useWordCards } from "./hooks/useWordCards.js";
import { useGamification } from "./hooks/useGamification.js";
import { useTelegramLink } from "./hooks/useTelegramLink.js";
import Review, { ReviewDeckSummary } from "./components/Review.jsx";
import Achievements, { ProgressCard } from "./components/Achievements.jsx";
import Dialogue from "./components/Dialogue.jsx";
import Games from "./components/Games.jsx";
import { API, cx, formatTime, localDateKey } from "./lib/format.js";
import { emptyUser, fallbackUser } from "./lib/profile.js";
import Dashboard from "./pages/Dashboard.jsx";
import Journey from "./pages/Journey.jsx";
import Certificate, { CertificateArtwork } from "./pages/Certificate.jsx";
import AuthModal from "./components/AuthModal.jsx";
import LessonModal from "./components/LessonModal.jsx";
import ChatPanel from "./components/ChatPanel.jsx";

const TOTAL = getCourse().lessons.length; // lessons in the learner's course

export default function App() {
  // With accounts configured, nobody sees the sample profile: people sign in first.
  const [user, setUser] = useState(supabaseReady ? emptyUser : fallbackUser);
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(!supabaseReady);
  const token = session?.access_token || "";
  const profileLoaded = useRef(false);
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(6);
  const [authMode, setAuthMode] = useState("register");
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hi there! Ask me to translate a sentence, explain a word, or help you start today’s answer.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const currentLesson = lessons[selected];
  const completed = useMemo(
    () =>
      new Set([
        ...(user.submissions || [])
          .filter(
            (s) =>
              Number(s.recordingDuration ?? s.duration ?? 0) >=
              (lessons[Number(s.lessonIndex)]?.minimumDurationSeconds ||
                Infinity),
          )
          .map((s) => Number(s.lessonIndex)),
        ...(user.completed &&
        (!user.submissions?.length || user.demo)
          ? Array.from({ length: user.completed }, (_, i) => i)
          : []),
      ]),
    [user],
  );
  const completedCount = Math.min(
    TOTAL,
    user.completed ??
      (user.submissions?.length
        ? new Set(
            user.submissions
              .filter(
                (s) =>
                  Number(s.recordingDuration ?? s.duration ?? 0) >=
                  (lessons[Number(s.lessonIndex)]?.minimumDurationSeconds ||
                    Infinity),
              )
              .map((s) => Number(s.lessonIndex)),
          ).size
        : 0),
  );
  const todaySubmissions = (user.submissions || []).filter(
    (submission) => submission.day === localDateKey(),
  );
  const activeSpeakingIndex = todaySubmissions.length
    ? Number(todaySubmissions.at(-1).lessonIndex)
    : completedCount;
  const progress = Math.min(100, Math.round((completedCount / TOTAL) * 100));
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Oral",
  })
    .format(new Date())
    .toUpperCase();
  const weekActivity = useMemo(() => {
    const active = new Set(
      user.days?.length
        ? user.days
        : (user.submissions || []).map((s) => s.day),
    );
    const monday = new Date(`${localDateKey()}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      return {
        day: new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: "UTC",
        }).format(d)[0],
        done: active.has(localDateKey(d)),
      };
    });
  }, [user]);

  const completedIndexes = useMemo(
    () => [...completed].sort((a, b) => a - b),
    [completed],
  );
  const deck = useWordCards({
    supabase,
    userId: session?.user?.id || null,
    completedIndexes,
  });
  const online = useOnline();
  const pwa = usePwa();
  const [dialogueFocus, setDialogueFocus] = useState(null);
  const mistakes = useMistakes({ supabase, userId: session?.user?.id || null });
  const gam = useGamification({ supabase, userId: session?.user?.id || null });
  const telegram = useTelegramLink({ supabase, userId: session?.user?.id || null });
  const reviewsToday = normalizeDaily(gam.stats.extra.daily, localDateKey()).reviews;
  const weekly = useMemo(() => {
    const today = localDateKey();
    const range = weekRange(today);
    const reviewed = deck.rows.filter(
      (r) => r.last_review && dayKey(new Date(r.last_review)) >= range.start && dayKey(new Date(r.last_review)) <= range.end,
    ).length;
    return weeklySummary({
      today,
      days: user.days || [],
      submissions: user.submissions || [],
      reviews: reviewed,
      conversations: gam.stats.extra.weeks?.[range.start]?.dialogues ?? 0,
      streak: user.streak || 0,
      topTag: mistakes.stats[0]?.tag ?? null,
    });
  }, [user, deck.rows, gam.stats.extra.weeks, mistakes.stats]);
  const deckWithXp = useMemo(
    () => ({
      ...deck,
      submitReview: (key, rating, mode) => {
        deck.submitReview(key, rating, mode);
        gam.award({ type: "review", rating, mode });
      },
    }),
    [deck, gam.award],
  );

  // Past mistakes become "fix it" cards in the word review (up to 5 new a day).
  useEffect(() => {
    if (deck.status !== "ready" || mistakes.status !== "ready" || !mistakes.items.length) return;
    deck.addMistakes(mistakes.items);
  }, [deck.status, mistakes.status, mistakes.items]); // eslint-disable-line react-hooks/exhaustive-deps

  // XP for a new active day (once per day).
  useEffect(() => {
    if (gam.status !== "ready") return;
    const day = localDateKey();
    if (!(user.days || []).includes(day) || !user.streak) return;
    if (gam.stats.extra.streakXpDay === day) return;
    gam.award({ type: "streak_day", streak: user.streak });
    gam.markStreakXpDay(day);
  }, [gam.status, user.days, user.streak, gam.stats.extra.streakXpDay]);

  // Ten word reviews count as an active day, like a lesson does.
  useEffect(() => {
    if (gam.status !== "ready" || deck.status !== "ready") return;
    if (supabase && !profileLoaded.current) return;
    const day = localDateKey();
    if ((user.days || []).includes(day)) return;
    if (!countsForStreak({ lessonDone: false, reviewsToday })) return;
    const settle = settleFreeze({
      days: user.days || [],
      freezeDays: gam.stats.extra.freezeDays,
      freezes: gam.stats.freezes,
      today: day,
    });
    if (settle.used) gam.applyFreeze(settle);
    setUser((old) => {
      const next = advanceStreak({
        streak: old.streak || 0,
        days: old.days || [],
        freezeDays: settle.freezeDays,
        today: day,
      });
      return {
        ...old,
        streak: next,
        bestStreak: Math.max(old.bestStreak || 0, next),
        days: [...new Set([...(old.days || []), day])],
      };
    });
  }, [gam.status, deck.status, reviewsToday, user.days]);

  // One streak freeze for every 7 days in a row.
  useEffect(() => {
    if (gam.status !== "ready" || !user.streak) return;
    const result = earnFreeze({
      streak: user.streak,
      lastGrantedAt: gam.stats.extra.lastFreezeStreak,
      freezes: gam.stats.freezes,
    });
    if (result.lastGrantedAt === gam.stats.extra.lastFreezeStreak && !result.granted)
      return;
    gam.grantFreeze(result);
    if (result.granted) setToast("You earned a streak freeze!");
  }, [gam.status, user.streak]);

  // Unlock badges when a threshold is crossed.
  useEffect(() => {
    if (gam.status !== "ready") return;
    const fresh = newlyEarned(gam.stats.badges, {
      completedCount: Math.min(TOTAL, user.completed ?? completed.size),
      streak: user.streak || 0,
      bestStreak: user.bestStreak || 0,
      wordsLearned: deck.rows.filter((r) => r.state === 2).length,
      reviewsTotal: gam.stats.extra.reviewsTotal,
      dialoguesTotal: gam.stats.extra.dialoguesTotal || 0,
      weeklyStreak: weeklyStreak(user.days || [], gam.stats.extra.weeklyGoal, localDateKey()),
      level: levelFor(gam.stats.xp).level,
    });
    if (!fresh.length) return;
    gam.unlockBadges(fresh.map((b) => b.id));
    setToast(`Badge unlocked: ${fresh[0].title}`);
  }, [gam.status, gam.stats.xp, gam.stats.extra.reviewsTotal, gam.stats.extra.dialoguesTotal, user.streak, user.completed, completed, deck.rows]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      document.querySelector(".menu-toggle")?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => {
        setApiAvailable(true);
        setAiAvailable(Boolean(d.speechFeedback || (token && d.ai)));
      })
      .catch(() => setApiAvailable(false));
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !session) {
      profileLoaded.current = false;
      return;
    }
    profileLoaded.current = false;
    supabase
      .from("profiles")
      .select("name, data")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setToast("Could not load your progress. Please try again.");
          return;
        }
        setUser({
          ...emptyUser,
          ...(data?.data || {}),
          name: data?.name || session.user.user_metadata?.name || "Learner",
        });
        profileLoaded.current = true;
      });
    // Reload only when a different user signs in: Supabase also emits auth events on tab
    // refocus/token refresh with a new session object, which must not refetch the profile.
  }, [session?.user?.id]);
  useEffect(() => {
    if (!supabase || !session || !profileLoaded.current) return;
    supabase
      .from("profiles")
      .update({
        name: user.name,
        data: user,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .then(({ error }) => {
        if (error) setToast("Your progress could not be saved. Check your connection.");
      });
  }, [user, session]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Stable identity: LessonModal resets its shown feedback whenever this changes,
  // so a fresh object on every render would hide the "Send my answer" button.
  const lessonFeedback = useMemo(() => {
    const latest = user.submissions
      ?.filter((s) => Number(s.lessonIndex) === selected)
      .at(-1);
    return latest
      ? {
          ...latest.feedback,
          transcript: latest.transcript || "",
          attemptNumber: latest.attemptNumber || 1,
        }
      : null;
  }, [user.submissions, selected]);

  function openLesson(i) {
    setSelected(i);
    setFeedback(null);
    setModal("lesson");
    setMenuOpen(false);
  }
  function handleAuth(name) {
    setModal("");
    setToast(`Welcome, ${(name || "friend").split(" ")[0]}!`);
  }
  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setUser(emptyUser);
    setPage("home");
    setToast("You are signed out.");
  }
  function markDemoDone(seconds, processedFeedback = null) {
    const attemptNumber =
      1 +
      (user.submissions || []).filter(
        (submission) => Number(submission.lessonIndex) === selected,
      ).length;
    const demoFeedback = {
      ...(processedFeedback?.feedback ||
        createNoTranscriptFeedback(lessons[selected], seconds)),
      attemptNumber,
    };
    const day = localDateKey();
    const settle = settleFreeze({
      days: user.days || [],
      freezeDays: gam.stats.extra.freezeDays,
      freezes: gam.stats.freezes,
      today: day,
    });
    if (settle.used) gam.applyFreeze(settle);
    const firstForCard =
      !(user.submissions || []).some(
        (submission) =>
          Number(submission.lessonIndex) === selected &&
          Number(submission.recordingDuration || 0) >=
            lessons[selected].minimumDurationSeconds,
      ) && seconds >= lessons[selected].minimumDurationSeconds;
    gam.award({ type: firstForCard ? "lesson_first" : "lesson_retry" });
    mistakes.add(processedFeedback?.feedback?.grammarCorrections, "lesson", selected);
    setUser((old) => {
      const currentDay = localDateKey();
      const previousSubmissions = old.submissions || [];
      const firstSubmissionToday = !previousSubmissions.some(
        (submission) => submission.day === currentDay,
      );
      const days = [...new Set([...(old.days || []), currentDay])];
      const nextStreak = !firstSubmissionToday
        ? old.streak || 0
        : advanceStreak({
            streak: old.streak || 0,
            days: old.days || [],
            freezeDays: settle.freezeDays,
            today: currentDay,
          });
      const firstSubmissionForCard =
        !previousSubmissions.some(
          (submission) =>
            Number(submission.lessonIndex) === selected &&
            Number(submission.recordingDuration || 0) >=
              lessons[selected].minimumDurationSeconds,
        ) && seconds >= lessons[selected].minimumDurationSeconds;
      const attemptNumber =
        1 +
        previousSubmissions.filter(
          (submission) => Number(submission.lessonIndex) === selected,
        ).length;
      const attemptFeedback = { ...demoFeedback, attemptNumber };
      return {
        ...old,
        completed: Math.min(
          lessons.length,
          (old.completed || 0) + (firstSubmissionForCard ? 1 : 0),
        ),
        completedToday: true,
        streak: nextStreak,
        bestStreak: Math.max(old.bestStreak || 0, nextStreak),
        days,
        submissions: [
          ...previousSubmissions,
          {
            attemptId: crypto.randomUUID(),
            cardId: lessons[selected].id,
            lessonIndex: selected,
            day: currentDay,
            recordingDuration: Math.round(seconds),
            recordingTimestamp: new Date().toISOString(),
            attemptNumber,
            consentStatus: processedFeedback
              ? "cloudflare-processed-transiently"
              : "not-granted",
            detectedVocabulary:
              processedFeedback?.detectedVocabulary ||
              demoFeedback.vocabulary?.detected ||
              [],
            feedback: attemptFeedback,
          },
        ],
      };
    });
    setFeedback(demoFeedback);
    return demoFeedback;
  }
  async function submitAnswer(blob, seconds, aiConsent = false) {
    if (!apiAvailable) {
      return markDemoDone(seconds);
    }
    // Same path for everyone: feedback is produced transiently, then progress is saved
    // to the learner's profile by the effect above (signed-in users only).
    if (!aiAvailable || !aiConsent) return markDemoDone(seconds);
    const body = new FormData();
    body.append("audio", blob, "speaking-answer.webm");
    body.append("lessonIndex", selected);
    body.append("duration", seconds);
    body.append("aiConsent", String(aiConsent));
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Your answer could not be processed.");
        return null;
      }
      const result = markDemoDone(seconds, data);
      return { ...result, transcript: data.transcript || "" };
    } catch {
      setToast("Could not reach the speech feedback service. Please try again.");
      return null;
    }
  }
  async function sendChat(e) {
    e?.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatInput("");
    setChatMessages((old) => [
      ...old,
      { role: "user", text: message },
      { role: "assistant", text: "…", loading: true },
    ]);
    try {
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, lessonIndex: selected }),
      });
      const d = await r.json();
      setChatMessages((old) => [
        ...old.slice(0, -1),
        {
          role: "assistant",
          text:
            d.answer ||
            "Let’s try that together. What would you like to say in English?",
        },
      ]);
    } catch {
      const answer = /әдемі|красив|beautiful/i.test(message)
        ? "You can say: “This place is very beautiful.”"
        : `A helpful start could be: “This place is special because…” Try adding one detail about ${currentLesson.place}.`;
      setChatMessages((old) => [
        ...old.slice(0, -1),
        { role: "assistant", text: answer },
      ]);
    }
  }
  // A finished conversation earns XP; only the review (never the text) is stored.
  function saveDialogue({ scenarioId, turns, summary }) {
    gam.award({ type: "dialogue" });
    mistakes.add(summary?.corrections, "dialogue");
    if (!supabase || !session) return;
    supabase
      .from("dialogue_sessions")
      .insert({
        user_id: session.user.id,
        scenario_id: scenarioId,
        turns,
        summary,
      })
      .then(({ error }) => {
        if (error) setToast("Your conversation review could not be saved.");
      });
  }
  function navigate(next) {
    setPage(next);
    setMenuOpen(false);
    if (next === "certificate" && completedCount < TOTAL)
      setToast(`Complete all ${TOTAL} days to earn your certificate!`);
  }

  if (!authChecked) return <div className="app-shell" aria-busy="true" />;
  if (supabaseReady && !session)
    return (
      <div className="app-shell">
        <AuthModal
          required
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => {}}
          onAuth={handleAuth}
          onSignOut={signOut}
          user={user}
          token={token}
        />
      </div>
    );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        Skip to main content
      </a>
      <aside className={cx("sidebar", menuOpen && "sidebar-open")}>
        <div className="brand">
          <div className="brand-mark">
            <Compass size={23} strokeWidth={2.35} />
          </div>
          <div className="brand-name">
            speak<span>kaz</span>
            <small>YOUR KAZAKHSTAN JOURNEY</small>
          </div>
          <button
            className="icon-btn side-close"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main">
          <button
            onClick={() => navigate("home")}
            className={cx("nav-link", page === "home" && "active")}
            aria-current={page === "home" ? "page" : undefined}
          >
            <Home size={18} />
            <span>My dashboard</span>
          </button>
          <button
            onClick={() => navigate("journey")}
            className={cx("nav-link", page === "journey" && "active")}
            aria-current={page === "journey" ? "page" : undefined}
          >
            <BookOpen size={18} />
            <span>{TOTAL}-day journey</span>
            <span className="nav-badge">{TOTAL}</span>
          </button>
          <button
            onClick={() => navigate("review")}
            className={cx("nav-link", page === "review" && "active")}
            aria-current={page === "review" ? "page" : undefined}
          >
            <Layers size={18} />
            <span>Word review</span>
          </button>
          <button
            onClick={() => navigate("games")}
            className={cx("nav-link", page === "games" && "active")}
            aria-current={page === "games" ? "page" : undefined}
          >
            <Puzzle size={18} />
            <span>Word games</span>
          </button>
          <button
            onClick={() => navigate("dialogue")}
            className={cx("nav-link", page === "dialogue" && "active")}
            aria-current={page === "dialogue" ? "page" : undefined}
          >
            <MessageCircle size={18} />
            <span>Speaking partner</span>
          </button>
          <button
            onClick={() => navigate("achievements")}
            className={cx("nav-link", page === "achievements" && "active")}
            aria-current={page === "achievements" ? "page" : undefined}
          >
            <Trophy size={18} />
            <span>Level and badges</span>
          </button>
          <button
            onClick={() => navigate("certificate")}
            className={cx("nav-link", page === "certificate" && "active")}
            aria-current={page === "certificate" ? "page" : undefined}
          >
            <Award size={18} />
            <span>My certificate</span>
          </button>
        </nav>
        <div className="side-label journey-label">
          YOUR JOURNEY{" "}
          <button
            className="mini-add"
            aria-label={`Open the ${TOTAL}-day journey`}
            onClick={() => navigate("journey")}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="journey-preview">
          <div className="journey-days">
            <span className="tiny-ring">
              <Compass size={15} />
            </span>
            <span>Discover Kazakhstan</span>
          </div>
          <div className="side-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="journey-caption">
            {completedCount} of {TOTAL} days complete
          </div>
        </div>
        <div className="sidebar-spacer" />
        <button className="help-card" onClick={() => setChatOpen(true)}>
          <span className="help-icon">
            <MessageCircle size={17} />
          </span>
          <span>
            <b>Need a little help?</b>
            <small>Your English buddy is here.</small>
          </span>
          <ChevronRight size={15} />
        </button>
        {pwa.canInstall && (
          <button className="install-btn" onClick={pwa.install}>
            Install the app
          </button>
        )}
        <ThemeToggle />
        <div className="profile-mini">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="profile-mini-text">
            <b>{user.name}</b>
            <small>
              {token ? "Explorer" : "Sample profile"}
            </small>
          </div>
          <button
            className="icon-btn profile-more"
            aria-label="Account and sign-in"
            onClick={() => setModal("auth")}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-area" id="content" tabIndex={-1}>
        <header className="topbar">
          <button
            className="icon-btn menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu size={20} />
          </button>
          <div className="crumb">
            <span>My workspace</span>
            <ChevronRight size={14} />
            <b>
              {page === "home"
                ? "My dashboard"
                : page === "journey"
                  ? `${TOTAL}-day journey`
                  : page === "review"
                    ? "Word review"
                    : page === "games"
                      ? "Word games"
                      : page === "dialogue"
                        ? "Speaking partner"
                        : page === "achievements"
                          ? "Level and badges"
                          : "My certificate"}
            </b>
          </div>
          <div className="topbar-right">
            <div className="today-pill">
              <span className="live-dot" /> DAY{" "}
              {Math.min(activeSpeakingIndex + 1, TOTAL)}{" "}
              <span className="today-pill-sep">·</span> {todayLabel}
            </div>
            <button className="streak-pill" title="Your daily streak">
              <Flame size={16} fill="currentColor" /> {user.streak || 0}{" "}
              <span>day streak</span>
            </button>
            <button className="top-avatar" onClick={() => setModal("auth")}>
              {user.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <div className="page-content">
          <OfflineBanner online={online} />
          {pwa.updateReady && (
            <div className="offline-banner" role="status">
              <span>A new version is ready.</span>
              <button className="update-btn" onClick={pwa.applyUpdate}>
                Reload
              </button>
            </div>
          )}
          <ErrorBoundary key={page}>
          {page === "home" && (
            <Dashboard
              {...{
                user,
                completedCount,
                progress,
                openLesson,
                navigate,
                setModal,
                setAuthMode,
                token,
                lessons,
                deck,
                gam,
                reviewsToday,
                focus: recommendFocus(mistakes.stats, completedIndexes, lessons),
                weekly,
                startFocus: (tag) => {
                  setDialogueFocus(tag);
                  navigate("dialogue");
                },
              }}
            />
          )}
          {page === "journey" && (
            <Journey
              {...{
                completed,
                completedCount,
                openLesson,
                progress,
                submissions: user.submissions || [],
              }}
            />
          )}
          {page === "review" && (
            <Review
              {...{ speakWord, navigate, completedCount }}
              deck={deckWithXp}
            />
          )}
          {page === "games" && (
            <Games
              {...{ completedIndexes, speakWord, navigate }}
              award={gam.award}
            />
          )}
          {page === "dialogue" && (
            <Dialogue
              {...{ token, aiAvailable, completedCount, navigate }}
              onFinished={saveDialogue}
              focusTag={dialogueFocus}
              onAddPhrases={deck.addCustom}
              canAddPhrases={deck.canAddCustom && deck.status === "ready"}
            />
          )}
          {page === "achievements" && (
            <Achievements
              gam={gam}
              completedCount={completedCount}
              telegram={telegram}
              wordsLearned={deck.rows.filter((r) => r.state === 2).length}
              wordsTotal={deck.rows.length}
              streak={user.streak || 0}
              days={user.days || []}
              reviewsToday={reviewsToday}
              lessonDone={(user.submissions || []).some(
                (s) =>
                  s.day === localDateKey() &&
                  Number(s.recordingDuration ?? 0) >=
                    (lessons[Number(s.lessonIndex)]?.minimumDurationSeconds ||
                      Infinity),
              )}
            />
          )}
          {page === "certificate" && (
            <Certificate {...{ user, completedCount, setPage }} />
          )}
          </ErrorBoundary>
        </div>
        <footer className="footer">
          <span>
            Made with <Heart className="heart" size={12} fill="currentColor" />{" "}
            for curious minds in Kazakhstan
          </span>
          <span>
            SMALL STEPS. BIG VOICES. <span className="footer-dot">●</span>{" "}
            <b>{completedCount}/{TOTAL}</b> DAYS
          </span>
        </footer>
      </main>

      <aside className="right-rail">
        <div className="rail-head">
          <div>
            <div className="eyebrow">YOUR PROGRESS</div>
            <h2>This month</h2>
          </div>
          <button className="icon-btn">
            <MoreHorizontal size={19} />
          </button>
        </div>
        <div className="streak-card">
          <div className="streak-card-top">
            <div>
              <span className="fire-icon">
                <Flame size={18} fill="currentColor" />
              </span>
              <span className="streak-num">{user.streak || 0}</span>
              <span className="streak-unit">day streak</span>
            </div>
            <span className="best-streak">
              BEST: {user.bestStreak || 0} DAYS
            </span>
          </div>
          <p>
            You’re building a lovely habit. See you tomorrow?{" "}
            <TreePine size={14} className="inline-icon" />
          </p>
          <div className="week-days">
            {weekActivity.map(({ day, done }, i) => (
              <div key={i} className={cx("week-day", done && "week-done")}>
                <span>{day}</span>
                <i>{done ? <Check size={11} /> : ""}</i>
              </div>
            ))}
          </div>
          <div className="streak-milestones">
            {[7, 14, 30].map((milestone) => (
              <span
                key={milestone}
                className={cx(
                  (user.streak || 0) >= milestone && "milestone-earned",
                )}
              >
                {(user.streak || 0) >= milestone ? (
                  <Flame size={11} />
                ) : (
                  <LockKeyhole size={10} />
                )}{" "}
                {milestone} days
              </span>
            ))}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-icon blue">
              <BookOpen size={16} />
            </span>
            <span className="eyebrow">LESSONS FINISHED</span>
            <span className="stat-more">{TOTAL}</span>
          </div>
          <div className="stat-value">
            {String(completedCount).padStart(2, "0")}
            <span> / {TOTAL}</span>
          </div>
          <div className="mini-meter">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small className="stat-note">
            {TOTAL - completedCount} more to your certificate{" "}
            <Award size={12} className="inline-icon" />
          </small>
        </div>
        <div className="stat-card stat-words">
          <div className="stat-top">
            <span className="stat-icon orange">
              <Sparkles size={16} />
            </span>
            <span className="eyebrow">WORDS IN YOUR TOOLKIT</span>
            <ArrowUpRight className="stat-more" size={13} />
          </div>
          <div className="word-cloud">
            <span>adventure</span>
            <span>heritage</span>
            <span>scenic</span>
            <span>+ {completedCount * 6 || 0} more</span>
          </div>
          <small className="stat-note">
            You’re growing your vocabulary!{" "}
            <BookOpen size={12} className="inline-icon" />
          </small>
        </div>
        <div className="rail-nudge">
          <div className="nudge-top">
            <Sparkles size={14} />
            <b>A little reminder</b>
          </div>
          <p>
            It’s okay to make mistakes. That’s how your voice gets stronger.
          </p>
          <div className="nudge-doodle">
            keep going <ArrowUpRight size={11} />
          </div>
          <Sparkles className="nudge-spark" size={18} />
        </div>
        <div className="rail-help">
          <div className="help-bubble">
            <Headphones size={18} />
          </div>
          <div>
            <b>Need a hand?</b>
            <small>Chat with your AI buddy</small>
          </div>
          <button className="arrow-chip" onClick={() => setChatOpen(true)}>
            <ArrowRight size={15} />
          </button>
        </div>
      </aside>

      <button
        className="buddy-fab"
        onClick={() => setChatOpen((v) => !v)}
        title="Open speaking buddy"
      >
        <MessageCircle size={19} />
        <span>Ask your buddy</span>
      </button>
      {chatOpen && (
        <ChatPanel
          {...{ chatMessages, chatInput, setChatInput, sendChat, setChatOpen }}
        />
      )}
      {modal === "lesson" && (
        <LessonModal
          lesson={currentLesson}
          index={selected}
          onClose={() => setModal("")}
          key={selected}
          feedback={lessonFeedback}
          submitAnswer={submitAnswer}
          completed={completed.has(selected)}
          canRecord={
            selected === activeSpeakingIndex && completedCount < lessons.length
          }
          aiAvailable={aiAvailable}
        />
      )}
      {modal === "auth" && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setModal("")}
          onAuth={handleAuth}
          onSignOut={signOut}
          user={user}
          token={token}
        />
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
      {!apiAvailable && (
        <div
          className="offline-note"
          title="The demo works locally. Start npm run server for saved accounts and recordings."
        >
          <span /> Demo mode
        </div>
      )}
    </div>
  );
}
