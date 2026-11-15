// Theme preference: "system" (default), "light" or "dark". The resolved theme is written to
// <html data-theme="..."> and the CSS tokens do the rest.
export const THEMES = ["system", "light", "dark"];
export const THEME_KEY = "speakkaz:theme";

export function resolveTheme(pref, systemDark) {
  if (pref === "light" || pref === "dark") return pref;
  return systemDark ? "dark" : "light";
}

export function readThemePref() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return THEMES.includes(value) ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(pref) {
  if (typeof document === "undefined") return "light";
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const theme = resolveTheme(pref, systemDark);
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function saveThemePref(pref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* storage can be blocked; the choice then lasts for this visit only */
  }
  return applyTheme(pref);
}
