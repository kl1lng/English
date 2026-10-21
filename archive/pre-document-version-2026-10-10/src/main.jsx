import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Castle,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Compass,
  Crown,
  Droplets,
  Flame,
  Flower2,
  Footprints,
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
  MountainSnow,
  MoreHorizontal,
  Music2,
  Pause,
  PawPrint,
  Play,
  Plus,
  Shield,
  Send,
  Settings,
  Snowflake,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tent,
  TrainFront,
  Triangle,
  TreePine,
  Trees,
  Waves,
  CableCar,
  X,
} from "lucide-react";
import { lessons } from "./lessons.js";
import "./styles.css";

const API = "/api";
const cx = (...values) => values.filter(Boolean).join(" ");
const placeIcons = {
  tower: Landmark,
  triangle: Triangle,
  tent: Tent,
  museum: Building2,
  landmark: Landmark,
  city: MapPinned,
  mountain: Mountain,
  snowflake: Snowflake,
  cableCar: CableCar,
  droplets: Droplets,
  castle: Castle,
  trees: Trees,
  waves: Waves,
  paw: PawPrint,
  music: Music2,
  tree: TreePine,
  crown: Crown,
  ship: Compass,
  mountainSnow: MountainSnow,
  flower: Flower2,
  footprints: Footprints,
  train: TrainFront,
  shield: Shield,
  compass: Compass,
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
    day.setUTCDate(day.getUTCDate() - 3 + i);
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
        ...(user.submissions || []).map((s) => Number(s.lessonIndex)),
        ...(user.completed && !user.submissions?.length
          ? Array.from({ length: user.completed }, (_, i) => i)
          : []),
      ]),
    [user],
  );
  const completedCount = Math.min(
    30,
    user.completed ??
      (user.submissions?.length
        ? new Set(user.submissions.map((s) => s.day)).size
        : 0),
  );
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
        setAiAvailable(Boolean(d.ai));
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
  function markDemoDone() {
    const next = Math.min(lessons.length, completedCount + 1);
    const demoFeedback = {
      overall:
        "Lovely effort! Your ideas are coming together. Keep going — you’re building a great speaking habit.",
      tips: [
        "Try one descriptive adjective in your next answer.",
        "Give one reason using “because”.",
      ],
      example: "Turkistan is famous for its beautiful historical monuments.",
    };
    setUser((old) => ({
      ...old,
      completed: next,
      completedToday: true,
      streak: old.streak + 1,
      submissions: [
        ...(old.submissions || []),
        { lessonIndex: selected, day: localDateKey(), feedback: demoFeedback },
      ],
    }));
    setFeedback(demoFeedback);
  }
  async function submitAnswer(blob, seconds, aiConsent = false) {
    if (!token || !apiAvailable) {
      markDemoDone();
      return;
    }
    const body = new FormData();
    body.append("audio", blob, "speaking-answer.webm");
    body.append("lessonIndex", selected);
    body.append("duration", seconds);
    body.append("aiConsent", String(aiConsent));
    try {
      const res = await fetch(`${API}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || "Your answer could not be submitted.");
        return;
      }
      setUser(data.user);
      setFeedback(data.submission.feedback);
    } catch {
      setToast("Could not reach the server. Your answer was not submitted.");
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
              {Math.min(completedCount + (user.completedToday ? 0 : 1), 30)}{" "}
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
            <span>+ {completedCount * 5 || 0} more</span>
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
          feedback={
            feedback ||
            user.submissions?.find((s) => Number(s.lessonIndex) === selected)
              ?.feedback
          }
          submitAnswer={submitAnswer}
          completed={completed.has(selected)}
          canRecord={selected === completedCount && !user.completedToday}
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
  const nextIndex = Math.min(
    user.completedToday ? Math.max(0, completedCount - 1) : completedCount,
    29,
  );
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
            30 days. 30 places.
            <br />
            <em>A more confident you.</em>
          </h2>
          <p>
            Discover the places that make Kazakhstan special
            <br />
            while you practise speaking English, every day.
          </p>
          <button className="hero-btn" onClick={() => openLesson(nextIndex)}>
            <span>
              {user.completedToday
                ? "Review today’s card"
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
              {completedCount * 5 || 0}
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
              {user.completedToday
                ? "TODAY’S LITTLE WIN"
                : "YOUR NEXT ADVENTURE"}
            </div>
            <h2>
              {user.completedToday
                ? "Today’s speaking challenge — complete"
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
              {user.completedToday ? " · DONE" : ""}
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
                {user.completedToday ? "Review today’s card" : "Let’s speak"}{" "}
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
            Thirty places. Thirty stories. And thirty chances to find your
            voice.
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
          const done =
            completedCount > i || submissions.some((s) => s.lessonIndex === i);
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

function Certificate({ user, completedCount, setPage }) {
  return (
    <section className="certificate-page">
      <div className="section-kicker">A MILESTONE WORTH CELEBRATING</div>
      <h1>Your certificate</h1>
      <p>Thirty little steps add up to something remarkable.</p>
      {completedCount >= 30 ? (
        <>
          <div className="certificate-paper">
            <div className="cert-seal">
              <Award size={27} />
            </div>
            <div className="cert-overline">DISCOVER KAZAKHSTAN</div>
            <h2>
              Certificate
              <br />
              <i>of Completion</i>
            </h2>
            <p>This certificate is proudly presented to</p>
            <h3>{user.name}</h3>
            <p>
              for completing the
              <br />
              <b>30-Day Speaking Booster</b>
            </p>
            <div className="cert-bottom">
              <span>ENGLISH SPEAKING JOURNEY</span>
              <span>30 DAYS · 30 STORIES</span>
            </div>
          </div>
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
    [aiConsent, setAiConsent] = useState(false);
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
            if (s >= 119) {
              mr.stop();
              setRecording(false);
              clearInterval(timer.current);
              return 120;
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
    if (!chunks.current.length) return;
    setSaving(true);
    await submitAnswer(
      new Blob(chunks.current, {
        type: recorder.current?.mimeType || "audio/webm",
      }),
      seconds,
      aiConsent,
    );
    setSaving(false);
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
              <span className="hero-kicker">TODAY’S SPEAKING ADVENTURE</span>
              <h3>{lesson.prompt}</h3>
              <span className="modal-time">
                <Clock3 size={13} /> A relaxed 1–2 minute answer
              </span>
            </div>
          </div>
          <div className="lesson-modal-cols">
            <div className="modal-left">
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
                    Try a few if they feel right.
                  </span>
                </div>
                <div className="word-chips">
                  {lesson.words.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
              </div>
              <div className="modal-block">
                <div className="modal-block-title">
                  <span className="modal-icon lavender">
                    <Sparkles size={16} />
                  </span>
                  <b>Need a little start?</b>
                </div>
                <div className="sentence-prompt">
                  {lesson.starters.map((s, i) => (
                    <p key={s}>
                      <i>{i + 1}</i>“{s}”
                    </p>
                  ))}
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
                    <span className="limit-tag">1–2 MIN</span>
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
                      ? "AI text feedback is available · permission required"
                      : "Demo feedback · AI review isn’t connected yet"}
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
                    {formatTime(seconds)} <small>/ 2:00</small>
                  </div>
                  <div className="record-hint">
                    {recording
                      ? "YOU’RE DOING GREAT — TAP TO FINISH"
                      : audioUrl && seconds < 60
                        ? "KEEP GOING — YOU CAN SEND AT 1:00"
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
                        OpenAI for text feedback. Audio is deleted after
                        processing; pronunciation is not scored.
                      </span>
                    </label>
                  )}
                  {audioUrl && !feedback && (
                    <button
                      className="send-recording"
                      disabled={
                        saving || seconds < 60 || (aiAvailable && !aiConsent)
                      }
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
                  {feedback && (
                    <div className="feedback-box">
                      <div className="feedback-title">
                        <Sparkles size={13} />{" "}
                        {feedback.ai
                          ? "A little feedback for you"
                          : "Nice work!"}{" "}
                        <Check size={14} />
                      </div>
                      <p>{feedback.overall}</p>
                      {feedback.tips?.map((tip, i) => (
                        <div className="tip-line" key={tip}>
                          {i === 0 ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          {tip}
                        </div>
                      ))}
                      <div className="example-line">
                        <small>TRY THIS SENTENCE</small>
                        <p>“{feedback.example}”</p>
                      </div>
                      {feedback.scores && (
                        <div className="score-pills">
                          {Object.entries(feedback.scores).map(
                            ([name, value]) => (
                              <span key={name}>
                                {name} <b>{value}</b>
                              </span>
                            ),
                          )}
                        </div>
                      )}
                      <small className="feedback-caveat">
                        {feedback.ai
                          ? "Text feedback from the automatic transcript; it does not score pronunciation."
                          : "Demo feedback — set an AI key to get transcript-based tips."}
                      </small>
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
                  {feedback && (
                    <div className="feedback-box">
                      <div className="feedback-title">
                        <Sparkles size={13} /> A little feedback for you
                      </div>
                      <p>{feedback.overall}</p>
                      {feedback.tips?.map((t) => (
                        <div className="tip-line" key={t}>
                          <Sparkles size={12} />
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lesson-modal-bottom">
          <span>
            <ShieldCheck size={14} /> Audio is deleted after feedback is
            prepared.
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
