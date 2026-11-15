import React from "react";
import "./states.css";

// Placeholder lines while content loads. Announced as busy to assistive technology.
export default function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite" role="status">
      <span className="skeleton-sr">Loading…</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton-line" style={{ width: `${100 - (i % 3) * 18}%` }} />
      ))}
    </div>
  );
}
