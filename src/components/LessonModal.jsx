import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  LockKeyhole,
  Mic,
  Mic2,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { speakWord } from "../lib/audio.js";
import { API, cx, formatTime, localDateKey } from "../lib/format.js";
import PlaceIcon from "./PlaceIcon.jsx";

export default function LessonModal({
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
  // Re-sync only when a new attempt is saved, not on every parent re-render.
  useEffect(() => setShownFeedback(feedback), [feedback?.attemptNumber]);
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
                      <button
                        type="button"
                        className="word-sound"
                        aria-label={`Listen to ${activeWord.term}`}
                        onClick={() => speakWord(activeWord.term)}
                      >
                        <Volume2 size={16} />
                      </button>
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
                        I agree to send this clip to
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
