import { describe, expect, it } from "vitest";
import { raiseFontSizes } from "../../scripts/lib/fonts.mjs";

describe("raiseFontSizes", () => {
  it("lifts tiny sizes to the smallest token", () => {
    expect(raiseFontSizes("a{font-size: 9px;}").css).toBe("a{font-size: var(--fs-xs);}");
    expect(raiseFontSizes("a{font-size:11px}").css).toBe("a{font-size:var(--fs-xs)}");
    expect(raiseFontSizes("a{font-size: 11.5px;}").css).toBe("a{font-size: var(--fs-xs);}");
  });
  it("keeps readable sizes and other units", () => {
    ["a{font-size: 12px;}", "a{font-size: 14px;}", "a{font-size: 1rem;}", "a{font-size: var(--fs-sm);}"].forEach((css) =>
      expect(raiseFontSizes(css).css).toBe(css),
    );
  });
  it("counts the changes", () => {
    expect(raiseFontSizes("a{font-size:9px}b{font-size:10px}c{font-size:13px}").changed).toBe(2);
  });
});
