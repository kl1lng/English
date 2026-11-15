import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles.css";
import "./components/a11y.css";
import { applyTheme, readThemePref } from "./lib/theme.js";

applyTheme(readThemePref());
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (readThemePref() === "system") applyTheme("system");
});

createRoot(document.getElementById("root")).render(<App />);
