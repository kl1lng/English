import multer from "multer";
import { scenarioById } from "../src/data/scenarios.js";
import { MISTAKE_TAGS } from "../src/data/mistake-tags.js";
import { getRequestUser } from "../server/auth.js";
import { requestFeedbackText, transcribeAudio } from "../server/cloudflare-ai.js";
import {
  buildTurnMessages,
  MAX_RECORDING_SECONDS,
  MAX_SESSION_TURNS,
  parseTurnReply,
  sanitizeHistory,
} from "../server/dialogue.js";
import { consume, dailyLimit } from "../server/usage.js";

export const config = { api: { bodyParser: false } };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_request, file, done) => done(null, file.mimetype.startsWith("audio/")),
});

function receiveAudio(request, response) {
  return new Promise((resolve, reject) =>
    upload.single("audio")(request, response, (error) => (error ? reject(error) : resolve())),
  );
}

// One conversation turn: speech in, the partner's reply out. Audio is never stored.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to send a recording." });
  }
  if (process.env.AI_DIALOGUE_ENABLED === "false")
    return response.status(503).json({ error: "The speaking partner is switched off for now." });

  const user = await getRequestUser(request);
  if (!user) return response.status(401).json({ error: "Please sign in first." });
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN)
    return response.status(503).json({ error: "The speaking partner is not configured yet." });

  try {
    await receiveAudio(request, response);
  } catch (error) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return response.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? "This recording is too large. Please try a shorter clip." : "Please upload a supported audio recording.",
    });
  }

  const scenario = scenarioById(String(request.body?.scenarioId || ""));
  const turn = Number(request.body?.turn);
  const duration = Number(request.body?.duration);
  if (!request.file || !scenario || !Number.isInteger(turn) || turn < 1 || turn > MAX_SESSION_TURNS)
    return response.status(400).json({ error: "Choose a scenario and record an answer first." });
  if (request.body?.aiConsent !== "true")
    return response.status(403).json({ error: "Please confirm that you agree to send the recording for AI processing." });
  if (!Number.isFinite(duration) || duration < 1 || duration > MAX_RECORDING_SECONDS)
    return response.status(400).json({ error: "The recording must be between 1 and 45 seconds." });

  const focusTag = MISTAKE_TAGS.includes(request.body?.focusTag) ? request.body.focusTag : undefined;
  let history = [];
  try {
    history = sanitizeHistory(JSON.parse(String(request.body?.history || "[]")));
  } catch {
    return response.status(400).json({ error: "The conversation history is invalid." });
  }

  // Quotas: a new conversation counts once, and every turn counts too.
  if (user.userId) {
    if (turn === 1 && !(await consume(user.token, "dialogue_session", dailyLimit("DAILY_DIALOGUE_SESSIONS", 5))))
      return response.status(429).json({ error: "You have reached today’s limit of conversations. Please try again tomorrow." });
    if (!(await consume(user.token, "dialogue_turn", dailyLimit("DAILY_DIALOGUE_TURNS", 30))))
      return response.status(429).json({ error: "You have reached today’s limit of replies. Please try again tomorrow." });
  }

  try {
    const transcript = await transcribeAudio(request.file.buffer);
    const text = await requestFeedbackText(
      buildTurnMessages(scenario, history, transcript, turn, focusTag),
      { maxTokens: 600 },
    );
    const reply = parseTurnReply(text, { forceEnd: turn >= MAX_SESSION_TURNS });
    return response.status(200).json({ transcript, ...reply });
  } catch (error) {
    console.error("Speaking partner unavailable:", error.message);
    return response.status(502).json({ error: "The speaking partner could not answer. Please try again." });
  }
}
