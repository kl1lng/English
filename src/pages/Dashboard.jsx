import React from "react";
import {
  ArrowRight,
  Award,
  ChevronDown,
  Clock3,
  Compass,
  Flame,
  Mic2,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import { lessons } from "../lessons.js";
import Review, { ReviewDeckSummary } from "../components/Review.jsx";
import Achievements, { ProgressCard } from "../components/Achievements.jsx";
import { API, cx, formatTime, localDateKey } from "../lib/format.js";
import PlaceIcon from "../components/PlaceIcon.jsx";

export default function Dashboard({
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
      <ProgressCard
        gam={gam}
        lessonDone={Boolean(todayCardComplete)}
        reviewsToday={reviewsToday}
        navigate={navigate}
      />
      <ReviewDeckSummary
        rows={deck.rows}
        status={deck.status}
        navigate={navigate}
      />
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
              Create a free account to save your lessons, streaks, and
              feedback.
            </small>
          </span>
          <ArrowRight size={17} />
        </button>
      )}
    </>
  );
}
