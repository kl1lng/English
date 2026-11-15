// Measures latency and size of Cloudflare Workers AI text-to-speech for a few conversation replies.
// Usage: node scripts/tts-spike.mjs [model]   (default @cf/deepgram/aura-1)
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env. Uses a little of the free daily allowance.
// It saves the audio next to this file's folder in .superpowers/tts-spike/ so you can listen to it.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const model = process.argv[2] || "@cf/deepgram/aura-1";
const phrases = [
  "Hello! I just arrived in Astana. It looks so modern. What should I see first?",
  "That sounds wonderful. How long does it take to get to the Baiterek Tower from here?",
  "Thank you for the advice. Is it better to go in the morning or in the evening?",
  "We call it beshbarmak. It means five fingers, because people traditionally eat it by hand.",
  "Great talking with you today. I hope you enjoy the rest of your trip in Kazakhstan!",
];
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) {
  console.error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env first.");
  process.exit(1);
}
const out = path.resolve(import.meta.dirname, "../.superpowers/tts-spike");
fs.mkdirSync(out, { recursive: true });

for (const [i, text] of phrases.entries()) {
  const started = Date.now();
  const body = model.includes("melotts") ? { prompt: text, lang: "en" } : { text, speaker: "angus" };
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const buffer = Buffer.from(await res.arrayBuffer());
  const ms = Date.now() - started;
  const file = path.join(out, `phrase-${i + 1}.audio`);
  fs.writeFileSync(file, buffer);
  console.log(`#${i + 1} ${text.length} chars -> HTTP ${res.status}, ${ms} ms, ${buffer.length} bytes (${path.basename(file)})`);
}
