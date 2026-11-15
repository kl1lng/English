import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Vitest and Vite can import JSON and other things that plain Node (the Vercel runtime and
// `node server/index.js`) cannot. Load every server entry the way Node does.
const root = path.resolve(__dirname, "..");
const entries = [
  "api/chat.js",
  "api/feedback.js",
  "api/dialogue.js",
  "api/dialogue-summary.js",
  "api/remind.js",
  "api/telegram.js",
  "api/health.js",
  "server/index.js",
];

describe("server entries load in plain Node", () => {
  it.each(entries)("%s", (entry) => {
    const code = `import(${JSON.stringify("./" + entry)}).then(() => process.exit(0), (e) => { console.error(e.message); process.exit(1); })`;
    let failure = "";
    try {
      execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: root, stdio: "pipe", timeout: 20000, env: { ...process.env, PORT: "0" } });
    } catch (error) {
      failure = String(error.stderr || error.message);
    }
    expect(failure).toBe("");
  });
});
