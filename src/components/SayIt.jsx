import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Play, Square, Volume2 } from "lucide-react";
import { pickSayItWords } from "../lib/sayit.js";
import "./sayit.css";

const MAX_SECONDS = 5;

// Self-check for pronunciation: hear the recording, record yourself, compare by ear.
// The recording stays in this page only; it is never sent anywhere and nothing is scored.
export default function SayIt({ pool, speakWord }) {
  const words = useMemo(() => pickSayItWords(pool, 5), [pool]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | recording | recorded
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [verdicts, setVerdicts] = useState([]);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      recorder.current?.stream?.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  if (words.length < 1)
    return <p className="sayit-note">Finish a lesson to unlock this exercise.</p>;
  if (index >= words.length) {
    const close = verdicts.filter((v) => v === "close").length;
    return (
      <div className="sayit">
        <h2>Done</h2>
        <p className="sayit-note">
          {close} of {words.length} felt close. Repeat the ones that need work tomorrow. Nothing was sent or saved.
        </p>
        <button
          className="sayit-primary"
          onClick={() => {
            setIndex(0);
            setVerdicts([]);
            setPhase("idle");
          }}
        >
          Practise again
        </button>
      </div>
    );
  }
  const word = words[index];

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (url) URL.revokeObjectURL(url);
        setUrl(URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" })));
        setPhase("recorded");
      };
      recorder.current = mr;
      mr.start();
      setPhase("recording");
      timer.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch {
      setError("The microphone is not available. Allow microphone access in your browser and try again.");
    }
  }
  function stop() {
    clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }
  function playBoth() {
    speakWord(word.term);
    setTimeout(() => new Audio(url).play().catch(() => {}), 1800);
  }
  function next(verdict) {
    setVerdicts((v) => [...v, verdict]);
    if (url) URL.revokeObjectURL(url);
    setUrl("");
    setPhase("idle");
    setIndex(index + 1);
  }

  return (
    <div className="sayit">
      <p className="sayit-count">
        {index + 1} of {words.length}
      </p>
      <h2 className="sayit-word">{word.term}</h2>
      <p className="sayit-note">
        Compare your voice with the recording. This is a self-check: nothing is sent, saved or scored.
      </p>
      <div className="sayit-actions">
        <button className="sayit-secondary" onClick={() => speakWord(word.term)}>
          <Volume2 size={16} aria-hidden="true" /> Hear the recording
        </button>
        {phase === "recording" ? (
          <button className="sayit-record on" onClick={stop}>
            <Square size={16} aria-hidden="true" /> Stop
          </button>
        ) : (
          <button className="sayit-record" onClick={start}>
            <Mic size={16} aria-hidden="true" /> Record yourself
          </button>
        )}
      </div>
      {error && (
        <p className="sayit-error" role="alert">
          {error}
        </p>
      )}
      {phase === "recorded" && (
        <div className="sayit-compare">
          <button className="sayit-secondary" onClick={() => new Audio(url).play().catch(() => {})}>
            <Play size={16} aria-hidden="true" /> Play yours
          </button>
          <button className="sayit-secondary" onClick={playBoth}>
            <Play size={16} aria-hidden="true" /> Play both
          </button>
          <p className="sayit-ask">How close did it sound?</p>
          <div className="sayit-actions">
            <button className="sayit-secondary" onClick={() => next("close")}>
              Close
            </button>
            <button className="sayit-secondary" onClick={() => next("work")}>
              Needs work
            </button>
          </div>
        </div>
      )}
      {phase === "idle" && (
        <button className="sayit-skip" onClick={() => next("skip")}>
          Skip this word
        </button>
      )}
    </div>
  );
}
