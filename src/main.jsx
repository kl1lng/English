import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bird,
  BookOpen,
  BookOpenText,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Crown,
  Flame,
  Flower2,
  Heart,
  Headphones,
  Home,
  Landmark,
  LockKeyhole,
  MapPinned,
  LogOut,
  Menu,
  Mic,
  Mic2,
  MessageCircle,
  Mountain,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  SatelliteDish,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tent,
  Trophy,
  TreePine,
  Trees,
  Utensils,
  Users,
  Route,
  Leaf,
  Waves,
  X,
} from "lucide-react";
import { lessons } from "./lessons.js";
import { createNoTranscriptFeedback } from "./feedback.js";
import "./styles.css";

const API = "/api";
const cx = (...values) => values.filter(Boolean).join(" ");
const placeIcons = {
  map: MapPinned,
  city: Building2,
  route: Route,
  landmark: Landmark,
  tent: Tent,
  music: Music2,
  food: Utensils,
  trees: Trees,
  waves: Waves,
  mountain: Mountain,
  satellite: SatelliteDish,
  bird: Bird,
  trophy: Trophy,
  flower: Flower2,
  book: BookOpenText,
  crown: Crown,
  shield: ShieldCheck,
  leaf: Leaf,
  users: Users,
  compass: Compass,
  tree: TreePine,
};
function PlaceIcon({ name, size = 18, ...props }) {
  const Icon = placeIcons[name] || MapPinned;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const localDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Oral",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const fallbackUser = {
  name: "Antoshka",
  grade: "8",
  school: "Demo profile",
  completed: 6,
  streak: 4,
  bestStreak: 4,
  days: Array.from({ length: 4 }, (_, i) => {
    const day = new Date(`${localDateKey()}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 4 + i);
    return localDateKey(day);
  }),
  submissions: [],
};

function App() {
  const [user, setUser] = useState(fallbackUser);
  const [token, setToken] = useState(localStorage.getItem("kaz-token") || "");
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
        (!user.submissions?.length || user.school === "Demo profile")
          ? Array.from({ length: user.completed }, (_, i) => i)
          : []),
      ]),
    [user],
  );
  const completedCount = Math.min(
    30,
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
  const progress = Math.min(100, Math.round((completedCount / 30) * 100));
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

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => {
        setApiAvailable(true);
        setAiAvailable(Boolean(d.speechFeedback || (token && d.ai)));
      })
      .catch(() => setApiAvailable(false));
    if (token)
      fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          if (!r.ok) throw new Error();
          setUser(await r.json());
        })
        .catch(() => {
          localStorage.removeItem("kaz-token");
          setToken("");
        });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function openLesson(i) {
    setSelected(i);
    setFeedback(null);
    setModal("lesson");
    setMenuOpen(false);
  }
  function handleAuth(data) {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("kaz-token", data.token);
    setModal("");
    setToast(`Welcome, ${data.user.name.split(" ")[0]}!`);
  }
  function signOut() {
    setUser(fallbackUser);
    setToken("");
    localStorage.removeItem("kaz-token");
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
    setUser((old) => {
      const currentDay = localDateKey();
      const previousDay = localDateKey(new Date(Date.now() - 86400000));
      const previousSubmissions = old.submissions || [];
      const firstSubmissionToday = !previousSubmissions.some(
        (submission) => submission.day === currentDay,
      );
      const days = [...new Set([...(old.days || []), currentDay])];
      const nextStreak = !firstSubmissionToday
        ? old.streak || 0
        : (old.days || []).includes(previousDay)
          ? (old.streak || 0) + 1
          : 1;
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
    const body = new FormData();
    body.append("audio", blob, "speaking-answer.webm");
    body.append("lessonIndex", selected);
    body.append("duration", seconds);
    body.append("aiConsent", String(aiConsent));
    if (!token) {
      if (!aiAvailable || !aiConsent) return markDemoDone(seconds);
      try {
        const res = await fetch(`${API}/feedback`, { method: "POST", body });
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
    try {
      const res = await fetch(`${API}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Your answer could not be submitted.");
        return null;
      }
      setUser(data.user);
      setFeedback(data.submission.feedback);
      return {
        ...data.submission.feedback,
        transcript: data.submission.transcript || "",
        attemptNumber: data.submission.attemptNumber || 1,
      };
    } catch {
      setToast("Could not reach the server. Your answer was not submitted.");
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
        body: JSON.stringify({ message }),
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
  function navigate(next) {
    setPage(next);
    setMenuOpen(false);
    if (next === "certificate" && completedCount < 30)
      setToast("Complete all 30 days to earn your certificate!");
  }

  return (
    <div className="app-shell">
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
        <nav className="main-nav">
          <button
            onClick={() => navigate("home")}
            className={cx("nav-link", page === "home" && "active")}
          >
            <Home size={18} />
            <span>My dashboard</span>
          </button>
          <button
            onClick={() => navigate("journey")}
            className={cx("nav-link", page === "journey" && "active")}
          >
            <BookOpen size={18} />
            <span>30-day journey</span>
            <span className="nav-badge">30</span>
          </button>
          <button
            onClick={() => navigate("certificate")}
            className={cx("nav-link", page === "certificate" && "active")}
          >
            <Award size={18} />
            <span>My certificate</span>
          </button>
        </nav>
        <div className="side-label journey-label">
          YOUR JOURNEY{" "}
          <button className="mini-add" onClick={() => navigate("journey")}>
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
            {completedCount} of 30 days complete
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
        <div className="profile-mini">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="profile-mini-text">
            <b>{user.name}</b>
            <small>
              {token
                ? `Class ${user.grade || "8"} · Explorer`
                : `Sample profile · class ${user.grade || "8"}`}
            </small>
          </div>
          <button
            className="icon-btn profile-more"
            onClick={() => setModal("auth")}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-area">
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
                  ? "30-day journey"
                  : "My certificate"}
            </b>
          </div>
          <div className="topbar-right">
            <div className="today-pill">
              <span className="live-dot" /> DAY{" "}
              {Math.min(activeSpeakingIndex + 1, 30)}{" "}
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
          {page === "certificate" && (
            <Certificate {...{ user, completedCount, setPage }} />
          )}
        </div>
        <footer className="footer">
          <span>
            Made with <Heart className="heart" size={12} fill="currentColor" />{" "}
            for curious minds in Kazakhstan
          </span>
          <span>
            SMALL STEPS. BIG VOICES. <span className="footer-dot">●</span>{" "}
            <b>{completedCount}/30</b> DAYS
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
            <span className="stat-more">30</span>
          </div>
          <div className="stat-value">
            {String(completedCount).padStart(2, "0")}
            <span> / 30</span>
          </div>
          <div className="mini-meter">
            <span style={{ width: `${progress}%` }} />
          </div>
          <small className="stat-note">
            {30 - completedCount} more to your certificate{" "}
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
          feedback={(() => {
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
          })()}
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

function Dashboard({
  user,
  completedCount,
  progress,
  openLesson,
  navigate,
  setModal,
  setAuthMode,
  token,
  lessons,
}) {
  const todayAttempt = (user.submissions || [])
    .filter((submission) => submission.day === localDateKey())
    .at(-1);
  const nextIndex = Math.min(
    todayAttempt ? Number(todayAttempt.lessonIndex) : completedCount,
    29,
  );
  const todayCardComplete =
    todayAttempt &&
    Number(todayAttempt.recordingDuration ?? todayAttempt.duration ?? 0) >=
      lessons[Number(todayAttempt.lessonIndex)].minimumDurationSeconds;
  const firstName = user.name.split(" ")[0];
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="date-line">
            <Sparkles className="sun-dot" size={12} />{" "}
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "2-digit",
              year: "numeric",
              timeZone: "Asia/Oral",
            })
              .format(new Date())
              .toUpperCase()}{" "}
            <Sun className="weather-dot" size={14} />
          </div>
          <h1>
            Hey {firstName}, ready to <span>find your voice?</span>
          </h1>
          <p>
            One small speaking challenge today. One big step forward.{" "}
            <Sparkles className="wave-hand" size={13} />
          </p>
        </div>
        <button
          className="profile-edit"
          onClick={() => {
            setAuthMode("register");
            setModal("auth");
          }}
        >
          <Settings size={15} />
          <span>My profile</span>
          <ChevronDown size={14} />
        </button>
      </section>
      <section className="hero-card">
        <div className="hero-photo" />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-kicker">
            <Sparkles size={13} /> YOUR JOURNEY ACROSS KAZAKHSTAN
          </div>
          <h2>
            30 days. 30 stories.
            <br />
            <em>A more confident you.</em>
          </h2>
          <p>
            Discover the places, people and traditions that make Kazakhstan
            special
            <br />
            while you practise speaking English, every day.
          </p>
          <button className="hero-btn" onClick={() => openLesson(nextIndex)}>
            <span>
              {todayCardComplete
                ? "Review today’s card"
                : todayAttempt
                  ? "Continue today’s challenge"
                  : completedCount
                    ? "Continue your journey"
                    : "Start your journey"}
            </span>
            <span className="btn-arrow">
              <ArrowRight size={17} />
            </span>
          </button>
          <div className="hero-count">
            <div className="tiny-avatars">
              <i>A</i>
              <i>S</i>
              <i>+ </i>
            </div>
            <span>A small daily practice, made just for you</span>
          </div>
        </div>
        <div className="hero-stamp">
          <Compass size={17} />
          <span>
            MADE IN
            <br />
            KAZAKHSTAN
          </span>
          <Star className="stamp-star" size={13} />
        </div>
        <div className="hero-coordinates">43°14′N &nbsp; 76°57′E</div>
      </section>
      <section className="stats-row">
        <div className="stat-tile">
          <div className="tile-icon peach">
            <Flame size={19} fill="currentColor" />
          </div>
          <div>
            <small>YOUR STREAK</small>
            <div className="tile-number">
              {user.streak || 0} <span>days</span>
            </div>
            <div className="tile-foot">
              {user.streak ? "You’re on a roll!" : "Let’s start today!"}{" "}
              <Flame size={12} />
            </div>
          </div>
          <Sparkles className="tile-decoration" size={20} />
        </div>
        <div className="stat-tile">
          <div className="tile-icon lavender">
            <Award size={19} />
          </div>
          <div>
            <small>LESSONS DONE</small>
            <div className="tile-number">
              {String(completedCount).padStart(2, "0")}
              <span className="tile-denom"> / 30</span>
            </div>
            <div className="tile-foot">
              You’re making progress <Sparkles size={12} />
            </div>
          </div>
          <div className="tile-mini-progress">
            <svg viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="22" />
              <circle
                className="ring-value"
                cx="27"
                cy="27"
                r="22"
                style={{ strokeDasharray: `${progress * 1.38} 138` }}
              />
            </svg>
            <span>{progress}%</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="tile-icon mint">
            <Sparkles size={18} />
          </div>
          <div>
            <small>NEW WORDS</small>
            <div className="tile-number">
              {completedCount * 6 || 0}
              <span> words</span>
            </div>
            <div className="tile-foot">
              Little words, big world <Sparkles size={12} />
            </div>
          </div>
          <div className="word-decoration">a–z</div>
        </div>
      </section>
      <section className="today-section">
        <div className="section-title">
          <div>
            <div className="section-kicker">
              {todayCardComplete
                ? "TODAY’S LITTLE WIN"
                : todayAttempt
                  ? "KEEP BUILDING TODAY’S ANSWER"
                  : "YOUR NEXT ADVENTURE"}
            </div>
            <h2>
              {todayCardComplete
                ? "Today’s speaking challenge — complete"
                : todayAttempt
                  ? "Continue today’s speaking challenge"
                  : "Today’s speaking challenge"}{" "}
              <Sun className="sun-mini" size={15} />
            </h2>
          </div>
          <button className="text-link" onClick={() => navigate("journey")}>
            See all 30 days <ArrowRight size={15} />
          </button>
        </div>
        <div className="lesson-feature">
          <div
            className="lesson-image"
            style={{
              backgroundImage: `url(https://images.unsplash.com/${lessons[nextIndex].photo}?auto=format&fit=crop&w=880&q=82)`,
            }}
          >
            <span className="image-day">
              DAY {String(nextIndex + 1).padStart(2, "0")}
              {todayCardComplete ? " · DONE" : todayAttempt ? " · RETRY" : ""}
            </span>
            <span className="image-place">
              <PlaceIcon name={lessons[nextIndex].icon} size={12} /> &nbsp;{" "}
              {lessons[nextIndex].place}
            </span>
          </div>
          <div className="lesson-detail">
            <div className="lesson-meta">
              <span className="level-tag">
                <Sparkles size={11} /> {lessons[nextIndex].level}
              </span>
              <span className="time-tag">
                <Clock3 size={13} /> 5 min
              </span>
            </div>
            <h3>{lessons[nextIndex].title}</h3>
            <p>
              Take a moment to explore a new corner of Kazakhstan. Then tell us
              what makes it unforgettable.
            </p>
            <div className="lesson-footer">
              <div className="lesson-skills">
                <span>
                  <Mic2 size={14} /> Speak
                </span>
                <i>·</i>
                <span>
                  <Sparkles size={13} /> Explore
                </span>
              </div>
              <button
                className="start-btn"
                onClick={() => openLesson(nextIndex)}
              >
                {todayCardComplete
                  ? "Review today’s card"
                  : todayAttempt
                    ? "Continue today’s practice"
                    : "Let’s speak"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="up-next-row">
        <div className="up-next-head">
          <div>
            <div className="section-kicker">COMING UP</div>
            <h2>Little places, big stories</h2>
          </div>
          <button className="circle-nav" onClick={() => navigate("journey")}>
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="up-next-grid">
          {lessons
            .slice(Math.min(nextIndex + 1, 27), Math.min(nextIndex + 4, 30))
            .map((l, i) => (
              <button
                className="place-card"
                key={l.title}
                onClick={() => openLesson(Math.min(nextIndex + i + 1, 29))}
              >
                <div
                  className="place-cover"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/${l.photo}?auto=format&fit=crop&w=450&q=75)`,
                  }}
                >
                  <PlaceIcon name={l.icon} size={19} />
                </div>
                <div className="place-caption">
                  <small>
                    DAY{" "}
                    {String(Math.min(nextIndex + i + 2, 30)).padStart(2, "0")} ·{" "}
                    {l.place}
                  </small>
                  <b>{l.title}</b>
                </div>
                <ArrowRight size={14} />
              </button>
            ))}
        </div>
      </section>
      {!token && (
        <button
          className="save-progress-banner"
          onClick={() => {
            setAuthMode("register");
            setModal("auth");
          }}
        >
          <span>
            <ShieldCheck size={17} />
          </span>
          <span>
            <b>Make this journey yours</b>
            <small>
              Create a free student account to save lessons, streaks, and
              feedback.
            </small>
          </span>
          <ArrowRight size={17} />
        </button>
      )}
    </>
  );
}

function Journey({
  completed,
  completedCount,
  openLesson,
  progress,
  submissions,
}) {
  return (
    <div className="journey-page">
      <div className="journey-page-head">
        <div>
          <div className="section-kicker">A LITTLE BIT EVERY DAY</div>
          <h1>Your 30-day journey</h1>
          <p>
            Thirty stories. Thirty chances to learn about Kazakhstan and find
            your voice.
          </p>
        </div>
        <div className="journey-progress">
          <div className="journey-progress-n">
            {String(completedCount).padStart(2, "0")}
            <span> / 30 days</span>
          </div>
          <div className="journey-progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <small>{progress}% of your journey</small>
        </div>
      </div>
      <div className="journey-banner">
        <Compass size={20} />
        <div>
          <b>Your next stop: {lessons[Math.min(completedCount, 29)].place}</b>
          <small>Take it one day, one sentence at a time.</small>
        </div>
        <Sparkles className="journey-banner-art" size={20} />
      </div>
      <div className="days-heading">
        <span>YOUR DAILY SPEAKING CARDS</span>
        <span>
          <i /> 5 min a day
        </span>
      </div>
      <div className="day-grid">
        {lessons.map((lesson, i) => {
          const done = completedCount > i || completed.has(i);
          return (
            <button
              key={i}
              className={cx(
                "day-card",
                done && "day-complete",
                i === completedCount && !done && "day-next",
              )}
              onClick={() => openLesson(i)}
            >
              <div className="day-card-top">
                <span>DAY {String(i + 1).padStart(2, "0")}</span>
                {done ? (
                  <span className="done-chip">
                    <Check size={11} />
                  </span>
                ) : i === completedCount ? (
                  <span className="today-chip">UP NEXT</span>
                ) : (
                  <span className="locked-chip">
                    <Play size={10} />
                  </span>
                )}
              </div>
              <PlaceIcon className="day-icon" name={lesson.icon} size={21} />
              <b>{lesson.title}</b>
              <small>{lesson.place}</small>
              <div className="day-card-bottom">
                <span>
                  <Clock3 size={11} /> 5 min
                </span>
                <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CertificateArtwork({ name, date, preview = false }) {
  return (
    <div className={cx("certificate-paper", preview && "cert-paper-preview")}>
      <div className="cert-paper-frame" aria-hidden="true" />
      <svg
        className="cert-landscape-art"
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="786" cy="135" r="54" />
        <path d="M0 213 120 157l92 48 137-103 137 113 103-63 121 80 100-87 190 84v71H0Z" />
        <path d="m0 245 155-68 128 77 155-95 131 76 140-65 116 69 106-54 69 31v84H0Z" />
        <path d="M0 270c116-37 180 17 284-14s148-16 231 7 168 20 247-7 144-11 238 18" />
        <path d="M645 277c45-42 92-62 147-58s85 24 124 7" />
        <circle className="cert-route-dot" cx="645" cy="277" r="7" />
        <circle className="cert-route-dot" cx="916" cy="226" r="7" />
      </svg>
      <div className="cert-brand-row">
        <div className="cert-brand-lockup">
          <span className="cert-brand-mark">
            <Compass size={20} strokeWidth={1.8} />
          </span>
          <span>
            <b>speakkaz</b>
            <small>DISCOVER KAZAKHSTAN</small>
          </span>
        </div>
        <div className="cert-program-mark">
          <span>30</span>
          <small>DAY<br />JOURNEY</small>
        </div>
      </div>
      <div className="cert-content">
        <div className="cert-eyebrow">
          <span /> A MILESTONE WORTH CELEBRATING <span />
        </div>
        <h2>
          Certificate <i>of completion</i>
        </h2>
        <p className="cert-awarded-to">This certificate is proudly presented to</p>
        <h3>{name || "Antoshka"}</h3>
        <p className="cert-description">
          for completing the <b>30-Day Speaking Booster</b> and sharing stories
          about the places, history and culture of Kazakhstan in English.
        </p>
        <div className="cert-achievements">
          <span><Check size={12} /> 30 daily speaking challenges</span>
          <i />
          <span><MapPinned size={13} /> 30 stories of Kazakhstan</span>
        </div>
      </div>
      <div className="cert-footer-row">
        <div className="cert-date-block">
          <small>COMPLETION DATE</small>
          <b>{date}</b>
        </div>
        <div className="cert-issuer-block">
          <small>ISSUED BY</small>
          <b>SpeakKaz · English learning journey</b>
        </div>
        <div className="cert-seal" aria-label="30 day completion award">
          <span className="cert-seal-inner">
            <Award size={20} strokeWidth={1.65} />
            <small>30<br />DAYS</small>
          </span>
        </div>
      </div>
      {preview && <div className="cert-preview-stamp">PREVIEW</div>}
    </div>
  );
}

function Certificate({ user, completedCount, setPage }) {
  const [showPreview, setShowPreview] = useState(false);
  const validSubmissions = (user.submissions || []).filter((submission) => {
    const lesson = lessons[Number(submission.lessonIndex)];
    return (
      lesson &&
      Number(submission.recordingDuration ?? submission.duration ?? 0) >=
        lesson.minimumDurationSeconds
    );
  });
  const earnedOn = new Set(validSubmissions.map((submission) => Number(submission.lessonIndex))).size >= 30
    ? validSubmissions
        .map((submission) => new Date(submission.submittedAt || submission.recordingTimestamp || 0))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => b - a)[0]
    : new Date();
  const certificateDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Oral",
  }).format(earnedOn);
  return (
    <section className="certificate-page">
      <div className="section-kicker">A MILESTONE WORTH CELEBRATING</div>
      <h1>Your certificate</h1>
      <p>Thirty little steps add up to something remarkable.</p>
      {completedCount >= 30 ? (
        <>
          <CertificateArtwork name={user.name} date={certificateDate} />
          <button
            className="primary-cta print-cert"
            onClick={() => window.print()}
          >
            Print or save as PDF <ArrowRight size={16} />
          </button>
        </>
      ) : (
        <div className="cert-locked">
          <div className="cert-lock-icon">
            <Award size={33} />
          </div>
          <h2>Your story is still unfolding.</h2>
          <p>
            Finish all 30 speaking challenges to unlock your certificate. You’ve
            completed <b>{completedCount} of 30</b> days so far — every practice
            counts.
          </p>
          <div className="cert-bar">
            <span style={{ width: `${(completedCount / 30) * 100}%` }} />
          </div>
          <div className="cert-count">{completedCount} / 30 DAYS</div>
          <button className="primary-cta" onClick={() => setPage("journey")}>
            Continue your journey <ArrowRight size={16} />
          </button>
          <button
            className="cert-preview-link"
            onClick={() => setShowPreview(true)}
          >
            Preview certificate <ArrowUpRight size={14} />
          </button>
        </div>
      )}
      {showPreview && completedCount < 30 && (
        <div
          className="cert-preview-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPreview(false);
          }}
        >
          <section
            className="cert-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cert-preview-title"
          >
            <div className="cert-preview-heading">
              <div>
                <div className="section-kicker">A LOOK AHEAD</div>
                <h2 id="cert-preview-title">Your certificate preview</h2>
              </div>
              <button
                className="icon-button cert-preview-close"
                aria-label="Close certificate preview"
                onClick={() => setShowPreview(false)}
              >
                <X size={18} />
              </button>
            </div>
            <CertificateArtwork
              name={user.name}
              date="Earned after day 30"
              preview
            />
            <p className="cert-preview-note">
              This is a sample. Your certificate unlocks after all 30 challenges
              are complete.
            </p>
          </section>
        </div>
      )}
    </section>
  );
}

function AuthModal({ mode, setMode, onClose, onAuth, onSignOut, user, token }) {
  const [values, setValues] = useState({
    name: "",
    grade: "8",
    school: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch(
        `${API}/auth/${mode === "register" ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onAuth(d);
    } catch (e) {
      setError(
        e.message === "Failed to fetch"
          ? "The server is not running yet. Start it with npm run server."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal">
        <button className="modal-x" onClick={onClose}>
          <X size={19} />
        </button>
        {token ? (
          <>
            <div className="auth-brand">
              <Compass size={21} />
            </div>
            <div className="section-kicker">YOUR ACCOUNT</div>
            <h2>Good to see you, {user.name}.</h2>
            <p>Your speaking journey is saved to your account.</p>
            <button className="auth-submit" onClick={onClose}>
              Back to your journey <ArrowRight size={16} />
            </button>
            <button className="signout-btn" onClick={onSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          </>
        ) : (
          <>
            <div className="auth-brand">
              <Compass size={21} />
            </div>
            <div className="section-kicker">YOUR JOURNEY STARTS HERE</div>
            <h2>
              {mode === "register"
                ? "Make this journey yours."
                : "Welcome back."}
            </h2>
            <p>
              {mode === "register"
                ? "Create a student profile and keep every new word and little victory."
                : "Pick up right where you left off."}
            </p>
            <div className="auth-tabs">
              <button
                className={mode === "register" ? "selected" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Create account
              </button>
              <button
                className={mode === "login" ? "selected" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </div>
            <form onSubmit={submit}>
              <label>
                Your name
                <input
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                  placeholder="e.g. Antoshka S."
                />
              </label>
              {mode === "register" && (
                <div className="auth-row">
                  <label>
                    Your class
                    <select
                      value={values.grade}
                      onChange={(e) =>
                        setValues({ ...values, grade: e.target.value })
                      }
                    >
                      {[7, 8, 9, 10].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    School
                    <input
                      required
                      value={values.school}
                      onChange={(e) =>
                        setValues({ ...values, school: e.target.value })
                      }
                      placeholder="Your school"
                    />
                  </label>
                </div>
              )}
              {mode === "login" && (
                <label>
                  School
                  <input
                    required
                    value={values.school}
                    onChange={(e) =>
                      setValues({ ...values, school: e.target.value })
                    }
                    placeholder="Your school"
                  />
                </label>
              )}
              <label>
                Password
                <input
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  type="password"
                  required
                  minLength={6}
                  value={values.password}
                  onChange={(e) =>
                    setValues({ ...values, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button className="auth-submit" disabled={busy}>
                {busy
                  ? "One moment…"
                  : mode === "register"
                    ? "Create my account"
                    : "Sign in"}
                <ArrowRight size={16} />
              </button>
              <small className="privacy-note">
                <ShieldCheck size={13} /> Your practice belongs to you.
              </small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function LessonModal({
  lesson,
  index,
  onClose,
  feedback,
  submitAnswer,
  completed,
  canRecord,
  aiAvailable,
}) {
  const [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(0),
    [audioUrl, setAudioUrl] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [durationReady, setDurationReady] = useState(false),
    [aiConsent, setAiConsent] = useState(false),
    [shownFeedback, setShownFeedback] = useState(feedback),
    [activeWord, setActiveWord] = useState(null);
  const maxDurationSeconds = lesson.maxDurationSeconds || 120;
  const recorder = useRef(null),
    chunks = useRef([]),
    streamRef = useRef(null),
    timer = useRef(null),
    active = useRef(true);
  useEffect(() => {
    const currentUrl = audioUrl;
    return () => {
      if (currentUrl && currentUrl !== "demo") URL.revokeObjectURL(currentUrl);
    };
  }, [audioUrl]);
  useEffect(
    () => () => {
      active.current = false;
      clearInterval(timer.current);
      try {
        if (recorder.current?.state === "recording") recorder.current.stop();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => setShownFeedback(feedback), [feedback]);
  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording needs microphone access in a secure browser tab.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      setAudioUrl("");
      setDurationReady(false);
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recorder.current = mr;
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (active.current && chunks.current.length) {
          const blob = new Blob(chunks.current, {
            type: mr.mimeType || "audio/webm",
          });
          setAudioUrl(URL.createObjectURL(blob));
        }
      };
      mr.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(
        () =>
          setSeconds((s) => {
            if (s >= maxDurationSeconds - 1) {
              mr.stop();
              setRecording(false);
              clearInterval(timer.current);
              return maxDurationSeconds;
            }
            return s + 1;
          }),
        1000,
      );
    } catch {
      setError("Please allow microphone access so we can record your answer.");
    }
  }
  function stop() {
    recorder.current?.stop();
    clearInterval(timer.current);
    setRecording(false);
  }
  async function send() {
    if (!chunks.current.length || !durationReady || seconds < 1) return;
    setSaving(true);
    try {
      const result = await submitAnswer(
        new Blob(chunks.current, {
          type: recorder.current?.mimeType || "audio/webm",
        }),
        seconds,
        aiConsent,
      );
      if (result) setShownFeedback(result);
    } finally {
      setSaving(false);
    }
  }
  function tryAgain() {
    setShownFeedback(null);
    setAudioUrl("");
    setDurationReady(false);
    chunks.current = [];
    setSeconds(0);
    setError("");
    setPlaying(false);
  }
  const [playing, setPlaying] = useState(false);
  const audioEl = useRef(null);
  return (
    <div
      className="modal-backdrop lesson-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lesson-modal">
        <div className="lesson-modal-top">
          <div>
            <div className="section-kicker">
              DAY {String(index + 1).padStart(2, "0")} ·{" "}
              {lesson.place.toUpperCase()}
            </div>
            <h2>{lesson.title}</h2>
          </div>
          <button className="modal-x" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="lesson-modal-scroll">
          <div
            className="modal-hero"
            style={{
              backgroundImage: `linear-gradient(90deg,rgba(13,35,59,.72),rgba(13,35,59,.04)),url(https://images.unsplash.com/${lesson.photo}?auto=format&fit=crop&w=1100&q=85)`,
            }}
          >
            <PlaceIcon
              className="modal-hero-icon"
              name={lesson.icon}
              size={34}
            />
            <div>
              <span className="hero-kicker">
                {lesson.level.toUpperCase()} · TODAY’S SPEAKING ADVENTURE
              </span>
              <h3>{lesson.title}</h3>
              <span className="modal-time">
                <Clock3 size={13} /> Speak for {lesson.minimumDurationSeconds}–
                {lesson.recommendedDurationSeconds} seconds
              </span>
            </div>
          </div>
          <div className="lesson-modal-cols">
            <div className="modal-left">
              <div className="quick-fact">
                <Sparkles size={15} />
                <div>
                  <b>QUICK FACT</b>
                  <p>{lesson.quickFact}</p>
                </div>
              </div>
              <div className="modal-block">
                <div className="modal-block-title">
                  <span className="modal-icon orange">
                    <Compass size={16} />
                  </span>
                  <b>Take a moment to think about…</b>
                </div>
                <ol className="task-list">
                  {lesson.tasks.map((t, i) => (
                    <li key={t}>
                      <i>{i + 1}</i>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="modal-block vocab-block">
                <div className="modal-block-title">
                  <span className="modal-icon blue">
                    <BookOpen size={16} />
                  </span>
                  <b>Your useful words</b>
                  <span className="soft-note">
                    {lesson.minimumVocabulary} needed · tap to translate
                  </span>
                </div>
                <div className="word-chips">
                  {lesson.words.map((word) => (
                    <button
                      type="button"
                      className={cx(
                        "word-chip",
                        activeWord?.term === word.term && "word-chip-active",
                      )}
                      key={word.term}
                      aria-pressed={activeWord?.term === word.term}
                      onClick={() =>
                        setActiveWord((active) =>
                          active?.term === word.term ? null : word,
                        )
                      }
                    >
                      {word.term}
                    </button>
                  ))}
                </div>
                {activeWord && (
                  <div className="vocab-detail">
                    <div>
                      <b>{activeWord.term}</b>
                      <span>
                        {activeWord.kk} · {activeWord.ru}
                      </span>
                    </div>
                    <p>“{activeWord.example}”</p>
                  </div>
                )}
              </div>
              <div className="modal-block">
                <div className="modal-block-title">
                  <span className="modal-icon lavender">
                    <Sparkles size={16} />
                  </span>
                  <b>Need a little start?</b>
                </div>
                <div className="sentence-prompt">
                  {lesson.starters.length ? (
                    lesson.starters.map((starter, i) => (
                      <p key={starter}>
                        <i>{i + 1}</i>“{starter}”
                      </p>
                    ))
                  ) : (
                    <p className="final-prompt">
                      Organise your final response independently and include
                      examples from your journey.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="record-panel">
              {canRecord ? (
                <>
                  <div className="record-panel-head">
                    <div>
                      <span className="section-kicker">YOUR TURN</span>
                      <h3>Find your voice.</h3>
                    </div>
                    <span className="limit-tag">
                      {lesson.minimumDurationSeconds}–
                      {lesson.maxDurationSeconds} SEC
                    </span>
                  </div>
                  <p>
                    There’s no perfect answer. Just your answer. Take a breath
                    and begin when you’re ready.
                  </p>
                  <div
                    className={cx(
                      "ai-status",
                      aiAvailable ? "ai-enabled" : "ai-demo",
                    )}
                  >
                    <i />
                    {aiAvailable
                      ? "Optional transcript review · permission required"
                      : "Duration feedback · transcript review isn’t connected"}
                  </div>
                  <div
                    className={cx("mic-orbit", recording && "record-active")}
                  >
                    <span className="orbit-ring o1" />
                    <span className="orbit-ring o2" />
                    <button
                      className={cx("record-button", recording && "recording")}
                      disabled={saving}
                      onClick={recording ? stop : start}
                    >
                      {recording ? (
                        <Pause size={23} fill="currentColor" />
                      ) : (
                        <Mic size={23} />
                      )}
                    </button>
                  </div>
                  <div
                    className={cx("record-timer", recording && "timer-live")}
                  >
                    {recording && <span className="live-dot" />}
                    {formatTime(seconds)}{" "}
                    <small>/ {formatTime(maxDurationSeconds)}</small>
                  </div>
                  <div className="record-hint">
                    {recording
                      ? "YOU’RE DOING GREAT — TAP TO FINISH"
                      : audioUrl && seconds < lesson.minimumDurationSeconds
                        ? "SHORT RECORDING — SEND IT FOR FEEDBACK OR TRY AGAIN"
                        : "TAP THE MIC WHEN YOU’RE READY"}
                  </div>
                  {error && <div className="mic-error">{error}</div>}
                  {audioUrl && (
                    <div className="audio-preview">
                      <button
                        className="audio-play"
                        onClick={() => {
                          if (audioEl.current?.paused) {
                            audioEl.current.play();
                            setPlaying(true);
                          } else {
                            audioEl.current?.pause();
                            setPlaying(false);
                          }
                        }}
                      >
                        {playing ? (
                          <Pause size={15} />
                        ) : (
                          <Play size={15} fill="currentColor" />
                        )}
                      </button>
                      <span>Your recording</span>
                      <audio
                        ref={audioEl}
                        src={audioUrl}
                        onEnded={() => setPlaying(false)}
                        onLoadedMetadata={(e) => {
                          const duration = e.currentTarget.duration;
                          if (Number.isFinite(duration) && duration > 0)
                            setSeconds(Math.round(duration));
                          setDurationReady(true);
                        }}
                        onError={() => setDurationReady(true)}
                      />
                      <span className="audio-duration">
                        {formatTime(seconds)}
                      </span>
                    </div>
                  )}
                  {aiAvailable && (
                    <label className="ai-consent">
                      <input
                        type="checkbox"
                        checked={aiConsent}
                        onChange={(e) => setAiConsent(e.target.checked)}
                      />
                      <span>
                        With a parent or teacher’s permission, send this clip to
                        the connected AI service for transcription and feedback.
                        The audio is deleted after processing. Signed-in attempts
                        may retain the transcript for up to 90 days; demo
                        feedback is kept only in this browser session. Do not
                        include personal details. Pronunciation is not scored.
                      </span>
                    </label>
                  )}
                  {audioUrl && !shownFeedback && (
                    <button
                      className="send-recording"
                      disabled={saving || !durationReady || seconds < 1}
                      onClick={send}
                    >
                      {saving ? (
                        "Preparing your feedback…"
                      ) : (
                        <>
                          Send my answer <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}
                  {shownFeedback && (
                    <div className="feedback-box">
                      <div className="feedback-title">
                        <Sparkles size={13} /> Your Speaking Feedback{" "}
                        <Check size={14} />
                      </div>
                      {shownFeedback.attemptNumber && (
                        <small className="attempt-label">
                          Attempt {shownFeedback.attemptNumber} saved
                        </small>
                      )}
                      <p className="feedback-strength">
                        {shownFeedback.strength}
                      </p>
                      <div className="feedback-metrics">
                        <div>
                          <small>Speaking time</small>
                          <b>
                            {shownFeedback.duration.seconds}s /{" "}
                            {shownFeedback.duration.minimum}s
                          </b>
                          <span>
                            {shownFeedback.duration.met
                              ? "Goal reached"
                              : "Below minimum"}
                          </span>
                        </div>
                        <div>
                          <small>Target vocabulary</small>
                          <b>
                            {shownFeedback.vocabulary.assessed
                              ? `${shownFeedback.vocabulary.detected.length}/${shownFeedback.vocabulary.requiredCount} required`
                              : "Not assessed"}
                          </b>
                          <span>
                            {shownFeedback.vocabulary.assessed
                              ? `${shownFeedback.vocabulary.detected.length}/${shownFeedback.vocabulary.targetCount} target terms detected`
                              : "No transcript available"}
                          </span>
                        </div>
                      </div>
                      <p className="feedback-row">
                        <b>Vocabulary</b>
                        {shownFeedback.vocabulary.text}
                      </p>
                      <p className="feedback-row">
                        <b>Content</b>
                        {shownFeedback.content.text}
                      </p>
                      <div className="feedback-row">
                        <b>Grammar</b>
                        {shownFeedback.grammarCorrections.length ? (
                          shownFeedback.grammarCorrections.map((correction) => (
                            <p
                              className="grammar-correction"
                              key={correction.original}
                            >
                              “{correction.original}” → “{correction.corrected}”
                            </p>
                          ))
                        ) : (
                          <span>
                            {shownFeedback.grammarAssessed
                              ? "No correction was selected for this attempt."
                              : "Not assessed — no transcript review."}
                          </span>
                        )}
                      </div>
                      <p className="feedback-row">
                        <b>Develop your answer</b>
                        {shownFeedback.developmentFeedback}
                      </p>
                      <div className="next-goal">
                        <small>YOUR ONE NEXT GOAL</small>
                        <p>{shownFeedback.nextGoal}</p>
                      </div>
                      {shownFeedback.transcriptAvailable && (
                        <details className="transcript-details">
                          <summary>View automatic transcript</summary>
                          <p>{shownFeedback.transcript}</p>
                          <small>Speech recognition can make mistakes.</small>
                        </details>
                      )}
                      <small className="feedback-caveat">
                        {shownFeedback.limitations}
                      </small>
                      <button className="try-again-btn" onClick={tryAgain}>
                        <Mic2 size={13} /> Try again
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="locked-message">
                  {completed ? <Star size={17} /> : <LockKeyhole size={16} />}
                  <b>
                    {completed
                      ? "A lovely step in your journey."
                      : "This card opens after your next speaking practice."}
                  </b>
                  <small>
                    {completed
                      ? "You’ve already completed this speaking card. Keep exploring the prompts and words."
                      : "One card a day is plenty. Finish today’s challenge and come back tomorrow for this one."}
                  </small>
                  {shownFeedback && (
                    <div className="feedback-box">
                      <div className="feedback-title">
                        <Sparkles size={13} /> Your Speaking Feedback
                      </div>
                      <p className="feedback-strength">
                        {shownFeedback.strength}
                      </p>
                      <p className="feedback-row">
                        <b>Speaking time</b>
                        {shownFeedback.duration.seconds}s /{" "}
                        {shownFeedback.duration.minimum}s required
                      </p>
                      <p className="feedback-row">
                        <b>Vocabulary</b>
                        {shownFeedback.vocabulary.text}
                      </p>
                      <div className="next-goal">
                        <small>YOUR ONE NEXT GOAL</small>
                        <p>{shownFeedback.nextGoal}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lesson-modal-bottom">
          <span>
            <ShieldCheck size={14} /> Uploaded audio is deleted after
            processing.
          </span>
          <span>
            <Sparkles size={12} /> <b>DAY {index + 1}</b> OF YOUR KAZAKHSTAN
            JOURNEY
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  setChatOpen,
}) {
  const endRef = useRef(null);
  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [chatMessages],
  );
  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-avatar">
          <Sparkles size={18} />
          <i />
        </div>
        <div>
          <b>Your speaking buddy</b>
          <small>
            <span className="live-dot" /> Always here to help
          </small>
        </div>
        <button className="icon-btn" onClick={() => setChatOpen(false)}>
          <X size={17} />
        </button>
      </div>
      <div className="chat-suggestion">
        <Sparkles size={13} /> Ask anything about English — no question is too
        small.
      </div>
      <div className="chat-feed">
        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={cx(
              "chat-message",
              m.role === "user" ? "from-user" : "from-buddy",
            )}
          >
            {m.loading ? <span className="typing">···</span> : m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="quick-prompts">
        <button
          onClick={() =>
            setChatInput("How do I say “Бұл жер өте әдемі” in English?")
          }
        >
          Translate a sentence
        </button>
        <button
          onClick={() => setChatInput("What does “cultural heritage” mean?")}
        >
          Explain a word
        </button>
      </div>
      <form className="chat-input" onSubmit={sendChat}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Write your question…"
        />
        <button type="submit" disabled={!chatInput.trim()}>
          <Send size={16} />
        </button>
      </form>
      <div className="chat-foot">
        A kind place to practise <TreePine size={13} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
