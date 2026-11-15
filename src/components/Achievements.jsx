import React from "react";
import { getCourse } from "../courses.js";
import { dayKey } from "../lib/time.js";
import { weeklyGoalProgress, weeklyStreak } from "../lib/weekly.js";
import Skeleton from "./Skeleton.jsx";
import {
  Award,
  BookOpen,
  Compass,
  Crown,
  Flame,
  Layers,
  LockKeyhole,
  Mic,
  Snowflake,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { BADGES } from "../lib/badges.js";
import { MAX_FREEZES } from "../lib/streak.js";
import { dailyGoalProgress, levelFor } from "../lib/xp.js";
import "./achievements.css";

const TOTAL = getCourse().lessons.length; // lessons in the learner's course

const badgeIcons = {
  mic: Mic,
  book: BookOpen,
  compass: Compass,
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  layers: Layers,
  sparkles: Sparkles,
  star: Star,
  award: Award,
};

// Compact card for the dashboard: level, XP bar, today's goal.
export function ProgressCard({ gam, lessonDone, reviewsToday, navigate }) {
  if (gam.status !== "ready") return null;
  const lvl = levelFor(gam.stats.xp);
  const goal = dailyGoalProgress({
    goal: gam.stats.dailyGoal,
    lessonDone,
    reviewsToday,
  });
  return (
    <section className="ach-card" aria-label="Your level and daily goal">
      <div className="ach-level">
        <span className="ach-level-badge" aria-hidden="true">{lvl.level}</span>
        <div className="ach-level-text">
          <b>Level {lvl.level}</b>
          <small>
            {lvl.xp} XP · {lvl.next - lvl.xp} to level {lvl.level + 1}
          </small>
          <div
            className="ach-bar"
            role="progressbar"
            aria-label="Progress to the next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={lvl.pct}
          >
            <span style={{ "--p": lvl.pct / 100 }} />
          </div>
        </div>
      </div>
      <div className="ach-goal">
        <Target size={18} aria-hidden="true" />
        <div>
          <b>{goal.done ? "Today’s goal is done" : "Today’s goal"}</b>
          <small>
            {goal.parts
              .map((p) => `${p.done ? "✓" : "○"} ${p.label}`)
              .join(" · ")}
          </small>
        </div>
      </div>
      <button className="ach-link" onClick={() => navigate("achievements")}>
        Badges and goals
      </button>
    </section>
  );
}

function Skill({ label, value, note }) {
  const pct = value == null ? 0 : Math.round(value * 100);
  return (
    <li className="ach-skill">
      <div>
        <b>{label}</b>
        <small>{note}</small>
      </div>
      <div
        className="ach-bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ "--p": pct / 100 }} />
      </div>
    </li>
  );
}

export default function Achievements({
  gam,
  streak,
  lessonDone,
  reviewsToday,
  days = [],
  completedCount = 0,
  wordsLearned = 0,
  wordsTotal = 0,
  telegram = null,
}) {
  if (gam.status === "loading")
    return <Skeleton lines={4} />;
  if (gam.status === "unavailable")
    return (
      <section className="ach-page">
        <h1>Achievements are not set up yet</h1>
        <p className="ach-note">
          The progress tables have not been created in the database yet. The rest of the app
          keeps working.
        </p>
      </section>
    );
  const { stats } = gam;
  const lvl = levelFor(stats.xp);
  const earned = new Set(stats.badges);
  const goal = dailyGoalProgress({ goal: stats.dailyGoal, lessonDone, reviewsToday });
  const today = dayKey();
  const week = weeklyGoalProgress({ days, goalDays: stats.extra.weeklyGoal, today });
  const weekStreakNow = weeklyStreak(days, stats.extra.weeklyGoal, today);
  return (
    <section className="ach-page">
      <header className="ach-head">
        <span className="ach-level-badge ach-level-big" aria-hidden="true">{lvl.level}</span>
        <div>
          <h1>Level {lvl.level}</h1>
          <p className="ach-note">
            {lvl.xp} XP · {lvl.next - lvl.xp} XP to level {lvl.level + 1}
          </p>
        </div>
      </header>

      <div className="ach-grid-2">
        <div className="ach-panel">
          <h2>Daily goal</h2>
          <div role="radiogroup" aria-label="Choose your daily goal" className="ach-options">
            {[
              { id: "lesson", title: "Lesson only", text: "Speak one lesson a day." },
              { id: "lesson+review", title: "Lesson and review", text: "A lesson and 10 word reviews." },
            ].map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={stats.dailyGoal === o.id}
                className={`ach-option ${stats.dailyGoal === o.id ? "on" : ""}`}
                onClick={() => gam.setGoal(o.id)}
              >
                <b>{o.title}</b>
                <small>{o.text}</small>
              </button>
            ))}
          </div>
          <p className="ach-note">
            {goal.done ? "Done for today. Well done." : "Not finished yet today."} A day counts for
            your streak with a lesson or 10 word reviews.
          </p>
        </div>

        <div className="ach-panel">
          <h2>Streak</h2>
          <p className="ach-streak">
            <Flame size={22} aria-hidden="true" /> <b>{streak}</b> day{streak === 1 ? "" : "s"}
          </p>
          <p className="ach-note">
            <Snowflake size={15} aria-hidden="true" /> Freezes: {stats.freezes} of {MAX_FREEZES}. A
            freeze protects your streak when you miss one day. You earn one for every 7 days in a
            row.
          </p>
        </div>
      </div>

      {telegram && telegram.status !== "off" && (
        <div className="ach-panel ach-reminders">
          <h2>Reminders in Telegram</h2>
          {telegram.status === "linked" ? (
            <>
              <p className="ach-note">
                Connected. You get one short message if you have not practised by evening.
              </p>
              <button className="ach-link" onClick={telegram.disconnect}>Disconnect</button>
            </>
          ) : telegram.status === "pending" ? (
            <>
              <p className="ach-note">
                Press Start in the Telegram chat that opened, then check the connection here.
              </p>
              <button className="ach-link" onClick={telegram.refresh}>Check connection</button>
              <button className="ach-link" onClick={telegram.connect}>Open Telegram again</button>
            </>
          ) : telegram.status === "error" ? (
            <p className="ach-note" role="alert">
              Reminders are not available right now. Please try again later.
            </p>
          ) : (
            <>
              <p className="ach-note">
                Get a gentle reminder if you have not practised today. You can switch it off any time.
              </p>
              <button
                className="ach-link"
                onClick={telegram.connect}
                disabled={telegram.status === "loading"}
              >
                Connect Telegram
              </button>
            </>
          )}
        </div>
      )}

      <div className="ach-panel ach-week">
        <h2>Weekly goal</h2>
        <p className="ach-note">
          Practise on {week.target} days a week. A day counts with a lesson or 10 word reviews.
        </p>
        <div className="ach-bar" role="progressbar" aria-label="Active days this week" aria-valuemin={0} aria-valuemax={week.target} aria-valuenow={Math.min(week.done, week.target)}>
          <span style={{ "--p": Math.min(1, week.done / week.target) }} />
        </div>
        <p className="ach-note">
          {week.done} of {week.target} days this week. Weeks in a row: <b>{weekStreakNow}</b>.
        </p>
        <div role="radiogroup" aria-label="Choose your weekly goal" className="ach-goal-days">
          {[3, 4, 5, 6].map((n) => (
            <button key={n} role="radio" aria-checked={week.target === n} className={week.target === n ? "on" : ""} onClick={() => gam.setWeeklyGoal(n)}>
              {n} days
            </button>
          ))}
        </div>
      </div>

      <h2 className="ach-title">Your skills</h2>
      <ul className="ach-skills">
        <Skill
          label="Vocabulary"
          value={wordsTotal ? wordsLearned / wordsTotal : 0}
          note={`${wordsLearned} of ${wordsTotal} words remembered`}
        />
        <Skill
          label="Speaking"
          value={completedCount / TOTAL}
          note={`${completedCount} of {TOTAL} lessons, ${stats.extra.dialoguesTotal || 0} conversations`}
        />
        <Skill
          label="Listening"
          value={
            (stats.extra.listenTotal || 0) >= 5
              ? stats.extra.listenCorrect / stats.extra.listenTotal
              : null
          }
          note={
            (stats.extra.listenTotal || 0) >= 5
              ? `${Math.round((stats.extra.listenCorrect / stats.extra.listenTotal) * 100)}% right in listening cards`
              : "Do a few listening cards in Word review"
          }
        />
      </ul>

      <h2 className="ach-title">Badges</h2>
      <ul className="ach-badges">
        {BADGES.map((b) => {
          const Icon = badgeIcons[b.icon] || Award;
          const has = earned.has(b.id);
          return (
            <li key={b.id} className={`ach-badge ${has ? "earned" : ""}`}>
              <span className="ach-badge-icon" aria-hidden="true">
                {has ? <Icon size={22} /> : <LockKeyhole size={20} />}
              </span>
              <b>{b.title}</b>
              <small>{b.text}</small>
              <span className="ach-sr">{has ? "Earned" : "Locked"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
