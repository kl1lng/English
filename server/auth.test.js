import { afterEach, describe, expect, it, vi } from "vitest";
import { getRequestUser } from "./auth.js";

afterEach(() => vi.unstubAllEnvs());

describe("getRequestUser", () => {
  it("skips the check when accounts are not configured (local demo)", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await getRequestUser({ headers: {} })).toEqual({ userId: null, token: "" });
  });

  it("rejects a request without a token when accounts are configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.invalid");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
    expect(await getRequestUser({ headers: {} })).toBeNull();
    expect(
      await getRequestUser({ headers: { authorization: "Basic abc" } }),
    ).toBeNull();
  });
});
