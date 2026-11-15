import React, { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { readThemePref, saveThemePref } from "../lib/theme.js";
import "./theme-toggle.css";

const OPTIONS = [
  { id: "system", label: "System", Icon: Monitor },
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
];

export default function ThemeToggle() {
  const [pref, setPref] = useState(readThemePref);
  function choose(id) {
    setPref(id);
    saveThemePref(id);
  }
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Colour theme">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={pref === id}
          className={pref === id ? "on" : ""}
          onClick={() => choose(id)}
          title={label}
          aria-label={label}
        >
          <Icon size={15} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
