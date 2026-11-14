import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Lightbulb, LockKeyhole, MessageCircle, Mic, RotateCcw, Square, Volume2 } from "lucide-react";
import { scenarios } from "../data/scenarios.js";
import "./dialogue.css";

const MAX_SECONDS = 45;
const MAX_TURNS = 6;

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.95;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith("en"));
  if (voice) utter.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Dialogue({
  token,
  aiAvailable,
  completedCount,
  onFinished,
  navigate,
  onAddPhrases,
  canAddPhrases,
}) {
  const [added, setAdded] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hint, setHint] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | recording | thinking | summary | done
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [turn, setTurn] = useState(1);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const startedAt = useRef(0);
  const logRef = useRef(null);

  useEffect(
    () => () => {
      clearInterval(timer.current);
      recorder.current?.stream?.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
    },
    [],
  );
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, phase]);

  function begin(s) {
    setScenario(s);
    setMessages([{ role: "ai", text: s.opening }]);
    setHint("");
    setSummary(null);
    setAdded(null);
    setTurn(1);
    setError("");
    setPhase("idle");
    speak(s.opening);
  }

  async function startRecording() {
    setError("");
    if (!consent) {
      setError("Please tick the box to allow sending your voice for AI processing.");
      return;
    }
    try {
      window.speechSynthesis?.cancel();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        send(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" }));
      };
      recorder.current = mr;
      startedAt.current = Date.now();
      setSeconds(0);
      mr.start();
      setPhase("recording");
      timer.current = setInterval(() => {
        const s = Math.round((Date.now() - startedAt.current) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stopRecording();
      }, 250);
    } catch {
      setError("The microphone is not available. Allow microphone access in your browser and try again.");
    }
  }

  function stopRecording() {
    clearInterval(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function send(blob) {
    const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setPhase("thinking");
    const body = new FormData();
    body.append("audio", blob, "answer.webm");
    body.append("scenarioId", scenario.id);
    body.append("turn", String(turn));
    body.append("duration", String(Math.min(duration, MAX_SECONDS)));
    body.append("aiConsent", "true");
    body.append("history", JSON.stringify(messages.map(({ role, text }) => ({ role, text }))));
    try {
      const res = await fetch("/api/dialogue", { method: "POST", headers: authHeaders(token), body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The partner could not answer.");
      const next = [
        ...messages,
        { role: "user", text: data.transcript },
        { role: "ai", text: data.reply },
      ];
      setMessages(next);
      setHint(data.hint || "");
      setTurn(turn + 1);
      speak(data.reply);
      if (data.end) await review(next);
      else setPhase("idle");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  async function review(all = messages) {
    if (!all.some((m) => m.role === "user")) {
      setPhase("idle");
      return;
    }
    setPhase("summary");
    try {
      const res = await fetch("/api/dialogue-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ scenarioId: scenario.id, turns: all.map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The review could not be created.");
      setSummary(data);
      onFinished?.({ scenarioId: scenario.id, turns: all.filter((m) => m.role === "user").length, summary: data });
    } catch (e) {
      setError(e.message);
      setSummary({ strengths: [], corrections: [], phrases: [] });
    }
    setPhase("done");
  }

  if (!aiAvailable)
    return (
      <section className="dlg-card">
        <MessageCircle size={28} aria-hidden="true" />
        <h1>Speaking partner</h1>
        <p>The speaking partner needs the speech service, which is not switched on yet. Everything else works as usual.</p>
      </section>
    );

  if (!scenario)
    return (
      <section className="dlg-page">
        <h1>Speaking partner</h1>
        <p className="dlg-note">
          Have a short conversation in English. Choose a situation, answer by voice, and get a
          review at the end. Your recordings are not stored.
        </p>
        <ul className="dlg-list">
          {scenarios.map((s) => {
            const locked = completedCount < s.unlockAfterLesson;
            return (
              <li key={s.id}>
                <button className="dlg-scenario" disabled={locked} onClick={() => begin(s)}>
                  <span className="dlg-scenario-icon" aria-hidden="true">
                    {locked ? <LockKeyhole size={18} /> : <MessageCircle size={18} />}
                  </span>
                  <span>
                    <b>{s.title}</b>
                    <small>
                      {locked
                        ? `Finish ${s.unlockAfterLesson} lessons to unlock`
                        : s.userGoal}
                    </small>
                  </span>
                  <span className="dlg-level">{s.level}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <section className="dlg-page">
      <div className="dlg-top">
        <button className="dlg-back" onClick={() => { window.speechSynthesis?.cancel(); setScenario(null); }}>
          ← All situations
        </button>
        <h1>{scenario.title}</h1>
        <p className="dlg-note">Your goal: {scenario.userGoal}</p>
      </div>

      <div className="dlg-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => (
          <div key={i} className={`dlg-msg dlg-${m.role}`}>
            <span className="dlg-who">{m.role === "ai" ? "Partner" : "You"}</span>
            <p>{m.text}</p>
            {m.role === "ai" && (
              <button className="dlg-listen" onClick={() => speak(m.text)} aria-label="Hear this message again">
                <Volume2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {phase === "thinking" && <p className="dlg-status" role="status">Listening to your answer…</p>}
        {phase === "summary" && <p className="dlg-status" role="status">Preparing your review…</p>}
      </div>

      {error && <p className="dlg-error" role="alert">{error}</p>}

      {phase !== "done" && (
        <div className="dlg-controls">
          {hint && phase === "idle" && (
            <p className="dlg-hint"><Lightbulb size={15} aria-hidden="true" /> You could say: “{hint}”</p>
          )}
          {turn === 1 && phase === "idle" && (
            <label className="dlg-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to send my voice for AI processing. It is not stored.</span>
            </label>
          )}
          {phase === "recording" ? (
            <button className="dlg-rec on" onClick={stopRecording}>
              <Square size={18} aria-hidden="true" /> Stop and send ({seconds}s / {MAX_SECONDS}s)
            </button>
          ) : (
            <button className="dlg-rec" onClick={startRecording} disabled={phase !== "idle"}>
              <Mic size={18} aria-hidden="true" /> Record your answer
            </button>
          )}
          {messages.some((m) => m.role === "user") && phase === "idle" && (
            <button className="dlg-secondary" onClick={() => review()}>
              Finish and get my review
            </button>
          )}
          <p className="dlg-count">Reply {Math.min(turn, MAX_TURNS)} of {MAX_TURNS}</p>
        </div>
      )}

      {phase === "done" && summary && (
        <div className="dlg-summary">
          <h2>Your review</h2>
          {summary.strengths.length > 0 && (
            <>
              <h3>What went well</h3>
              <ul>{summary.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </>
          )}
          {summary.corrections.length > 0 && (
            <>
              <h3>Small corrections</h3>
              <ul>
                {summary.corrections.map((c) => (
                  <li key={c.original}>
                    <del>{c.original}</del> <ArrowRight size={13} aria-hidden="true" /> <b>{c.corrected}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
          {summary.phrases.length > 0 && (
            <>
              <h3>Useful phrases</h3>
              <ul>{summary.phrases.map((p) => <li key={p}>{p}</li>)}</ul>
              {canAddPhrases && (
                <button
                  className="dlg-secondary"
                  disabled={added !== null}
                  onClick={() => setAdded(onAddPhrases(summary.phrases))}
                >
                  {added === null
                    ? "Add these phrases to word review"
                    : added > 0
                      ? `Added ${added} phrase${added === 1 ? "" : "s"} to word review`
                      : "Already in word review"}
                </button>
              )}
            </>
          )}
          <div className="dlg-actions">
            <button className="dlg-rec" onClick={() => begin(scenario)}>
              <RotateCcw size={16} aria-hidden="true" /> Try again
            </button>
            <button className="dlg-secondary" onClick={() => setScenario(null)}>Choose another situation</button>
            <button className="dlg-secondary" onClick={() => navigate("home")}>Dashboard</button>
          </div>
        </div>
      )}
    </section>
  );
}
