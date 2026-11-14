import { scenarioById } from "../src/data/scenarios.js";
import { getRequestUser } from "../server/auth.js";
import { requestFeedbackText } from "../server/cloudflare-ai.js";
import { buildSummaryMessages, parseSummary, sanitizeHistory } from "../server/dialogue.js";
import { consume, dailyLimit } from "../server/usage.js";

// Review of one finished conversation. Receives text only (no audio) and returns
// strengths, corrections that quote the learner, and phrases to reuse. Nothing is stored.
export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Use POST to request a review." });
  }
  if (process.env.AI_DIALOGUE_ENABLED === "false")
    return response.status(503).json({ error: "The speaking partner is switched off for now." });
  const user = await getRequestUser(request);
  if (!user) return response.status(401).json({ error: "Please sign in first." });

  const scenario = scenarioById(String(request.body?.scenarioId || ""));
  const turns = sanitizeHistory(request.body?.turns);
  const learnerTurns = turns.filter((t) => t.role === "user").map((t) => t.text);
  if (!scenario || !learnerTurns.length)
    return response.status(400).json({ error: "There is no conversation to review." });

  if (user.userId && !(await consume(user.token, "dialogue_summary", dailyLimit("DAILY_DIALOGUE_SUMMARIES", 10))))
    return response.status(429).json({ error: "You have reached today’s limit of reviews. Please try again tomorrow." });

  try {
    const text = await requestFeedbackText(buildSummaryMessages(scenario, turns), { maxTokens: 900 });
    return response.status(200).json(parseSummary(text, learnerTurns));
  } catch (error) {
    console.error("Conversation review unavailable:", error.message);
    return response.status(502).json({ error: "The review could not be created. Please try again." });
  }
}
