# Automated accessibility run (axe-core)

`axe-core` is a dev dependency. With the demo server running (`preview_start` name `web-demo`, or `npx vite --mode demo --port 5174`):

1. Open the app, then in the page console load axe: add a script tag with `src="/node_modules/axe-core/axe.min.js"`.
2. Disable transitions first, otherwise colours are measured mid-animation:
   `document.head.append(Object.assign(document.createElement("style"), { textContent: "*{transition:none!important;animation:none!important}" }))`
3. For each page (click the sidebar link) and each theme (`document.documentElement.setAttribute("data-theme", "light" | "dark")`) run
   `await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })` and read `violations`.

Goal: no violations on the seven pages in both themes. A screen reader check (NVDA or VoiceOver) is still a manual task.
