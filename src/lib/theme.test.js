import { describe, expect, it } from "vitest";
import { THEMES, resolveTheme } from "./theme.js";

describe("resolveTheme", () => {
  it("follows the system when the preference is system or unknown", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme(undefined, true)).toBe("dark");
    expect(resolveTheme("bad", false)).toBe("light");
  });
  it("lets the learner override the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("lists the three choices", () => {
    expect(THEMES).toEqual(["system", "light", "dark"]);
  });
});
