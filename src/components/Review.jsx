import React, { useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "./Skeleton.jsx";
import { ArrowRight, Check, Layers, RotateCcw, Volume2, X } from "lucide-react";
import { buildWordIndex } from "../lib/deck.js";
import { buildChoices, makeCloze } from "../lib/cloze.js";
import { dueCount, pickSession, Rating } from "../lib/srs.js";
import "./review.css";

const wordIndex = buildWordIndex();
const ratingButtons = [
  { rating: Rating.Again, label: "Forgot", key: "1" },
  { rating: Rating.Hard, label: "Hard", key: "2" },
  { rating: Rating.Good, label: "Good", key: "3" },
  { rating: Rating.Easy, label: "Easy", key: "4" },
];

function cardMode(position, entry) {
  // Rotate flip, fill-the-blank and listening; fall back to flip when a blank is not possible.
  if (entry?.custom) return "flip"; // your own phrases have no blank or recording
  const slot = position % 3;
  if (slot === 1 && entry && makeCloze(entry.example, entry.term)) return "cloze";
  if (slot === 2 && entry) return "listen";
  return "flip";
}

export function ReviewDeckSummary({ rows, navigate, status }) {
  const due = dueCount(rows);
  if (status !== "ready" || !rows.length) return null;
  return (
    <section className="review-banner" aria-label="Word review">
      <span className="review-banner-icon">
        <Layers size={20} aria-hidden="true" />
      </span>
      <div>
        <b>
          {due ? `${due} word${due === 1 ? "" : "s"} to review` : "All words reviewed"}
        </b>
        <small>
          {due
            ? "A few minutes now keeps them in your memory."
            : "Nothing is due. Come back later."}
        </small>
      </div>
      <button className="review-banner-btn" onClick={() => navigate("review")}>
        {due ? "Start" : "Open"} <ArrowRight size={14} aria-hidden="true" />
      </button>
    </section>
  );
}

export default function Review({
  deck,
  speakWord,
  navigate,
  completedCount,
}) {
  const { status, rows, submitReview, saveError, doneToday } = deck;
  const [queue, setQueue] = useState(null);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const shownAt = useRef(0);

  function start() {
    const session = pickSession(rows, new Date(), {
      size: 10,
      maxNew: 20,
      maxReviews: 100,
      doneNew: doneToday.doneNew,
      doneReviews: doneToday.doneReviews,
    });
    setQueue(session.map((r) => r.word_key));
    setPosition(0);
    setResults([]);
    setRevealed(false);
    setPicked(null);
    shownAt.current = Date.now();
  }

  const key = queue?.[position];
  const customTerm = key?.startsWith("c:")
    ? rows.find((r) => r.word_key === key)?.custom_term || key.slice(2).replace(/-/g, " ")
    : null;
  const entry = useMemo(
    () =>
      !key
        ? null
        : customTerm !== null
          ? { key, term: customTerm, kk: "", ru: "", example: "", lessonIndex: -1, custom: true }
          : wordIndex.get(key) || null,
    [key, customTerm],
  );
  const mode = key ? cardMode(position, entry) : "flip";
  const cloze = useMemo(
    () => (mode === "cloze" && entry ? makeCloze(entry.example, entry.term) : null),
    [mode, entry],
  );
  const choices = useMemo(() => {
    if ((!cloze && mode !== "listen") || !entry) return [];
    const pool = [...wordIndex.values()]
      .filter((w) => w.lessonIndex === entry.lessonIndex)
      .map((w) => w.term);
    const extra = [...wordIndex.values()].map((w) => w.term);
    return buildChoices(entry.term, [...pool, ...extra]);
  }, [cloze, entry, mode]);

  // Listening cards play the word as soon as they appear.
  useEffect(() => {
    if (mode === "listen" && entry) speakWord(entry.term);
  }, [mode, key, position]); // eslint-disable-line react-hooks/exhaustive-deps

  function rate(rating) {
    if (!key) return;
    submitReview(key, rating, mode);
    setResults((old) => [...old, { key, rating }]);
    if (position + 1 >= queue.length) setPosition(queue.length);
    else setPosition(position + 1);
    setRevealed(false);
    setPicked(null);
    shownAt.current = Date.now();
  }

  function choose(option) {
    if (picked) return;
    setPicked(option);
    setRevealed(true);
  }
  function continueAfterChoice() {
    const correct = picked && picked.toLowerCase() === entry.term.toLowerCase();
    const fast = Date.now() - shownAt.current < 4000;
    rate(correct ? (fast ? Rating.Easy : Rating.Good) : Rating.Again);
  }

  useEffect(() => {
    function onKey(e) {
      if (!queue || !entry || e.metaKey || e.ctrlKey || e.altKey) return;
      // Do not steal keys while the learner is typing (for example in the helper chat).
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      // A focused button handles Space and Enter itself.
      if ((e.key === " " || e.key === "Enter") && tag === "BUTTON") return;
      if (mode === "flip") {
        if (!revealed && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          setRevealed(true);
        } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
          rate(Number(e.key));
        }
      } else if (picked && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        continueAfterChoice();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (status === "loading")
    return <Skeleton lines={4} />;
  if (status === "unavailable")
    return (
      <section className="review-card review-empty">
        <h1>Word review is not set up yet</h1>
        <p>
          The review tables have not been created in the database. Everything else in the
          app keeps working.
        </p>
      </section>
    );
  if (!rows.length)
    return (
      <section className="review-card review-empty">
        <Layers size={28} aria-hidden="true" />
        <h1>Your word deck is empty</h1>
        <p>
          Words from each lesson you finish are added here for review. Complete your first
          lesson to start.
        </p>
        <button className="review-primary" onClick={() => navigate("journey")}>
          Go to lessons <ArrowRight size={15} aria-hidden="true" />
        </button>
      </section>
    );

  if (!queue) {
    const due = dueCount(rows);
    return (
      <section className="review-card review-empty">
        <Layers size={28} aria-hidden="true" />
        <h1>Word review</h1>
        <p>
          {due
            ? `${due} word${due === 1 ? "" : "s"} are ready. A session takes about three minutes.`
            : "Nothing is due right now. Come back later, or learn a new lesson to add words."}
        </p>
        <p className="review-meta">
          {rows.length} words in your deck · {completedCount} lessons completed
        </p>
        <button className="review-primary" onClick={start} disabled={!due}>
          Start review <ArrowRight size={15} aria-hidden="true" />
        </button>
        {saveError && (
          <p className="review-warn" role="status">
            Some answers could not be saved yet. They will be retried next time.
          </p>
        )}
      </section>
    );
  }

  if (position >= queue.length) {
    const good = results.filter((r) => r.rating >= Rating.Good).length;
    return (
      <section className="review-card review-empty">
        <Check size={28} aria-hidden="true" />
        <h1>Session complete</h1>
        <p>
          You reviewed {results.length} word{results.length === 1 ? "" : "s"}; {good} felt
          good or easy.
        </p>
        <div className="review-actions">
          <button
            className="review-primary"
            onClick={start}
            disabled={!dueCount(rows)}
          >
            <RotateCcw size={15} aria-hidden="true" /> More words
          </button>
          <button className="review-secondary" onClick={() => navigate("home")}>
            Back to dashboard
          </button>
        </div>
      </section>
    );
  }

  if (!entry) {
    // A card whose word is no longer in the lessons: skip it.
    return (
      <section className="review-card review-empty">
        <button className="review-primary" onClick={() => rate(Rating.Good)}>
          Next
        </button>
      </section>
    );
  }

  return (
    <section key={position} className="review-card review-enter" aria-live="polite">
      <div className="review-progress" aria-hidden="true">
        <span style={{ "--p": position / queue.length }} />
      </div>
      <p className="review-count">
        {position + 1} of {queue.length}
      </p>

      {mode === "flip" && (
        <>
          <div className="review-word">
            <h1>{entry.term}</h1>
            <button
              className="review-speak"
              onClick={() => speakWord(entry.term)}
              aria-label={`Hear the word ${entry.term}`}
            >
              <Volume2 size={20} aria-hidden="true" />
            </button>
          </div>
          {!revealed ? (
            <button className="review-primary" onClick={() => setRevealed(true)}>
              Show meaning <small>(Space)</small>
            </button>
          ) : (
            <>
              {entry.custom ? (
                <p className="review-example">
                  Your own phrase. Say it aloud in a sentence about Kazakhstan, then rate how easily it came.
                </p>
              ) : (
                <>
                  <dl className="review-answer">
                    <div>
                      <dt>Қазақша</dt>
                      <dd>{entry.kk}</dd>
                    </div>
                    <div>
                      <dt>Русский</dt>
                      <dd>{entry.ru}</dd>
                    </div>
                  </dl>
                  <p className="review-example">“{entry.example}”</p>
                </>
              )}
              <p className="review-ask">How well did you remember it?</p>
              <div className="review-rates">
                {ratingButtons.map((b) => (
                  <button
                    key={b.rating}
                    className={`review-rate review-rate-${b.rating}`}
                    onClick={() => rate(b.rating)}
                  >
                    {b.label}
                    <small>{b.key}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {(mode === "cloze" || mode === "listen") && (
        <>
          {mode === "cloze" ? (
            <>
              <p className="review-ask">Choose the word that fits.</p>
              <p className="review-sentence">{cloze.text}</p>
            </>
          ) : (
            <>
              <p className="review-ask">Listen and choose the word you hear.</p>
              <div className="review-word">
                <button
                  className="review-speak review-speak-big"
                  onClick={() => speakWord(entry.term)}
                  aria-label="Play the word again"
                >
                  <Volume2 size={26} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
          <div className="review-choices" role="group" aria-label="Answers">
            {choices.map((option) => {
              const isAnswer = option.toLowerCase() === entry.term.toLowerCase();
              const state = picked
                ? isAnswer
                  ? "right"
                  : option === picked
                    ? "wrong"
                    : ""
                : "";
              return (
                <button
                  key={option}
                  className={`review-choice ${state}`}
                  onClick={() => choose(option)}
                  disabled={Boolean(picked)}
                >
                  {option}
                  {state === "right" && <Check size={16} aria-label="correct" />}
                  {state === "wrong" && <X size={16} aria-label="wrong" />}
                </button>
              );
            })}
          </div>
          {picked && (
            <>
              <p className="review-example">
                {entry.kk} · {entry.ru}
              </p>
              <button className="review-primary" onClick={continueAfterChoice}>
                Next <ArrowRight size={15} aria-hidden="true" />
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
