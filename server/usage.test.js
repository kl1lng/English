import { afterEach, describe, expect, it, vi } from "vitest";
import { consume, dailyLimit } from "./usage.js";

afterEach(() => vi.unstubAllEnvs());

describe("dailyLimit", () => {
  it("uses the environment value when valid, else the fallback", () => {
    vi.stubEnv("TEST_LIMIT", "12");
    expect(dailyLimit("TEST_LIMIT", 30)).toBe(12);
    vi.stubEnv("TEST_LIMIT", "abc");
    expect(dailyLimit("TEST_LIMIT", 30)).toBe(30);
    vi.stubEnv("TEST_LIMIT", "0");
    expect(dailyLimit("TEST_LIMIT", 30)).toBe(30);
  });
});

describe("consume", () => {
  it("allows the call when accounts or the token are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await consume("token", "feedback", 5)).toBe(true);
  });
});
