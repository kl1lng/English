import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Puzzle, RotateCcw, Volume2 } from "lucide-react";
import { buildWordIndex, deckKeysForLessons } from "../lib/deck.js";
import { isOrderCorrect, makeOrder, makePairs } from "../lib/games.js";
import "./games.css";

const wordIndex = buildWordIndex();

function shuffled(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function Pairs({ pool, award }) {
  const [lang, setLang] = useState("ru");
  const [round, setRound] = useState(0);
  const pairs = useMemo(() => makePairs(pool, 5, Math.random, lang), [pool, lang, round]);
  const meanings = useMemo(() => shuffled(pairs), [pairs]);
  const [term, setTerm] = useState(null);
  const [done, setDone] = useState([]);
  const [wrong, setWrong] = useState(null);
  const finished = pairs.length > 0 && done.length === pairs.length;

  function again() {
    setRound((r) => r + 1);
    setDone([]);
    setTerm(null);
    setWrong(null);
  }
  function pickMeaning(pair) {
    if (!term || done.includes(pair.id)) return;
    if (term.id === pair.id) {
      const next = [...done, pair.id];
      setDone(next);
      setTerm(null);
      setWrong(null);
      if (next.length === pairs.length) award({ type: "game" });
    } else {
      setWrong(pair.id);
      setTimeout(() => setWrong(null), 600);
    }
  }

  return (
    <div>
      <div className="games-lang" role="group" aria-label="Meaning language">
        {[["ru", "Русский"], ["kk", "Қазақша"]].map(([id, label]) => (
          <button key={id} aria-pressed={lang === id} className={lang === id ? "on" : ""} onClick={() => { setLang(id); again(); }}>
            {label}
          </button>
        ))}
      </div>
      <p className="games-ask">Tap an English word, then its meaning.</p>
      <div className="games-cols">
        <ul aria-label="English words">
          {pairs.map((p) => (
            <li key={p.id}>
              <button
                className={`games-tile ${done.includes(p.id) ? "ok" : ""} ${term?.id === p.id ? "sel" : ""}`}
                aria-pressed={term?.id === p.id}
                disabled={done.includes(p.id)}
                onClick={() => setTerm(p)}
              >
                {p.term}
              </button>
            </li>
          ))}
        </ul>
        <ul aria-label="Meanings">
          {meanings.map((p) => (
            <li key={p.id}>
              <button
                className={`games-tile ${done.includes(p.id) ? "ok" : ""} ${wrong === p.id ? "bad" : ""}`}
                disabled={done.includes(p.id)}
                onClick={() => pickMeaning(p)}
              >
                {p.meaning}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="games-status" role="status">
        {finished ? "All matched. Well done!" : `${done.length} of ${pairs.length} matched`}
      </p>
      {finished && (
        <button className="games-primary" onClick={again}>
          <RotateCcw size={16} aria-hidden="true" /> Play again
        </button>
      )}
    </div>
  );
}

function Order({ pool, award, speakWord }) {
  const [round, setRound] = useState(0);
  const item = useMemo(() => {
    const candidates = shuffled(pool);
    for (const word of candidates) {
      const order = makeOrder(word.example);
      if (order) return { word, order };
    }
    return null;
  }, [pool, round]);
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null); // null | "right" | "wrong"

  if (!item) return <p className="games-status">Not enough sentences yet. Finish more lessons.</p>;
  const { order, word } = item;
  const left = order.chips.filter((c) => !picked.includes(c.id));
  const text = (ids) => ids.map((id) => order.chips.find((c) => c.id === id).text);

  function pick(chip) {
    if (result === "right") return;
    const next = [...picked, chip.id];
    setPicked(next);
    if (next.length === order.chips.length) {
      const ok = isOrderCorrect(order.answer, text(next));
      setResult(ok ? "right" : "wrong");
      if (ok) award({ type: "game" });
    }
  }
  function reset() {
    setPicked([]);
    setResult(null);
  }
  function next() {
    reset();
    setRound((r) => r + 1);
  }

  return (
    <div>
      <p className="games-ask">Put the words in order to build the sentence.</p>
      <div className={`games-line ${result || ""}`} aria-label="Your sentence" aria-live="polite">
        {picked.length ? text(picked).join(" ") : <span className="games-empty">Tap the words below…</span>}
      </div>
      <div className="games-chips">
        {left.map((chip) => (
          <button key={chip.id} className="games-chip" onClick={() => pick(chip)}>
            {chip.text}
          </button>
        ))}
      </div>
      <p className="games-status" role="status">
        {result === "right" && "Correct!"}
        {result === "wrong" && `Not quite. The sentence is: ${order.answer.join(" ")}`}
      </p>
      <div className="games-actions">
        {picked.length > 0 && result !== "right" && (
          <button className="games-secondary" onClick={reset}>
            <RotateCcw size={15} aria-hidden="true" /> Start over
          </button>
        )}
        <button className="games-secondary" onClick={() => speakWord(word.term)} aria-label={`Hear the word ${word.term}`}>
          <Volume2 size={15} aria-hidden="true" /> {word.term}
        </button>
        {result && (
          <button className="games-primary" onClick={next}>
            Next sentence <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Games({ completedIndexes, award, speakWord, navigate }) {
  const [tab, setTab] = useState("pairs");
  const pool = useMemo(
    () => deckKeysForLessons(completedIndexes).map((k) => wordIndex.get(k)).filter(Boolean),
    [completedIndexes],
  );
  if (pool.length < 5)
    return (
      <section className="games-page games-empty-card">
        <Puzzle size={28} aria-hidden="true" />
        <h1>Word games</h1>
        <p>Games use the words from lessons you have finished. Finish a lesson to unlock them.</p>
        <button className="games-primary" onClick={() => navigate("journey")}>
          Go to lessons <ArrowRight size={15} aria-hidden="true" />
        </button>
      </section>
    );
  return (
    <section className="games-page">
      <h1>Word games</h1>
      <div className="games-tabs" role="tablist" aria-label="Choose a game">
        {[["pairs", "Match pairs"], ["order", "Build the sentence"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="games-card" role="tabpanel">
        {tab === "pairs" ? (
          <Pairs pool={pool} award={award} />
        ) : (
          <Order pool={pool} award={award} speakWord={speakWord} />
        )}
      </div>
      <p className="games-note"><Check size={14} aria-hidden="true" /> Each finished round earns a little XP, up to a daily limit.</p>
    </section>
  );
}
