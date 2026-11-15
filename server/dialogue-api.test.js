import { afterEach, describe, expect, it, vi } from "vitest";
import summaryHandler from "../api/dialogue-summary.js";

function fakeResponse() {
  const res = { headers: {}, statusCode: 200, body: null };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => ((res.body = data), res);
  return res;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/dialogue-summary", () => {
  const body = {
    scenarioId: "airport-astana",
    turns: [
      { role: "ai", text: "Hello! What should I see first?" },
      { role: "user", text: "You should visit the Bayterek, I goed there yesterday." },
    ],
  };

  it("rejects other methods and a missing conversation", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    const res = fakeResponse();
    await summaryHandler({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(405);
    const res2 = fakeResponse();
    await summaryHandler({ method: "POST", headers: {}, body: { scenarioId: "airport-astana", turns: [] } }, res2);
    expect(res2.statusCode).toBe(400);
  });

  it("can be switched off", async () => {
    vi.stubEnv("AI_DIALOGUE_ENABLED", "false");
    const res = fakeResponse();
    await summaryHandler({ method: "POST", headers: {}, body }, res);
    expect(res.statusCode).toBe(503);
  });

  it("returns a review and drops corrections the learner never said", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  strengths: ["You gave a clear recommendation."],
                  corrections: [
                    { original: "I goed there", corrected: "I went there" },
                    { original: "never said this", corrected: "x" },
                  ],
                  phrases: ["You should visit", "It is famous for", "I would recommend"],
                }),
              },
            },
          ],
        }),
      })),
    );
    const res = fakeResponse();
    await summaryHandler({ method: "POST", headers: {}, body }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.corrections).toEqual([{ original: "I goed there", corrected: "I went there", tag: "other" }]);
    expect(res.body.phrases.length).toBe(3);
  });

  it("answers 502 when the model fails", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    const res = fakeResponse();
    await summaryHandler({ method: "POST", headers: {}, body }, res);
    expect(res.statusCode).toBe(502);
  });
});
