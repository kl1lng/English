import React from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Play,
  Sparkles,
} from "lucide-react";
import { lessons } from "../lessons.js";
import { API, cx, formatTime, localDateKey } from "../lib/format.js";
import PlaceIcon from "../components/PlaceIcon.jsx";

export default function Journey({
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
