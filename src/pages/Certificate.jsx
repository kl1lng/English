import React, { useState } from "react";
import { getCourse } from "../courses.js";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  Compass,
  MapPinned,
  X,
} from "lucide-react";
import { lessons } from "../lessons.js";
import { API, cx, formatTime, localDateKey } from "../lib/format.js";

const TOTAL = getCourse().lessons.length; // lessons in the learner's course

export function CertificateArtwork({ name, date, preview = false }) {
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
          <span>{TOTAL}</span>
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
          for completing the <b>{TOTAL}-Day Speaking Booster</b> and sharing stories
          about the places, history and culture of Kazakhstan in English.
        </p>
        <div className="cert-achievements">
          <span><Check size={12} /> {TOTAL} daily speaking challenges</span>
          <i />
          <span><MapPinned size={13} /> {TOTAL} stories of Kazakhstan</span>
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
        <div className="cert-seal" aria-label={`${TOTAL} day completion award`}>
          <span className="cert-seal-inner">
            <Award size={20} strokeWidth={1.65} />
            <small>{TOTAL}<br />DAYS</small>
          </span>
        </div>
      </div>
      {preview && <div className="cert-preview-stamp">PREVIEW</div>}
    </div>
  );
}


export default function Certificate({ user, completedCount, setPage }) {
  const [showPreview, setShowPreview] = useState(false);
  const validSubmissions = (user.submissions || []).filter((submission) => {
    const lesson = lessons[Number(submission.lessonIndex)];
    return (
      lesson &&
      Number(submission.recordingDuration ?? submission.duration ?? 0) >=
        lesson.minimumDurationSeconds
    );
  });
  const earnedOn = new Set(validSubmissions.map((submission) => Number(submission.lessonIndex))).size >= TOTAL
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
      {completedCount >= TOTAL ? (
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
            Finish all {TOTAL} speaking challenges to unlock your certificate. You’ve
            completed <b>{completedCount} of {TOTAL}</b> days so far — every practice
            counts.
          </p>
          <div className="cert-bar">
            <span style={{ width: `${(completedCount / TOTAL) * 100}%` }} />
          </div>
          <div className="cert-count">{completedCount} / {TOTAL} DAYS</div>
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
      {showPreview && completedCount < TOTAL && (
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
              date={`Earned after day ${TOTAL}`}
              preview
            />
            <p className="cert-preview-note">
              This is a sample. Your certificate unlocks after all {TOTAL} challenges
              are complete.
            </p>
          </section>
        </div>
      )}
    </section>
  );
}
