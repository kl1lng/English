import { describe, expect, it } from "vitest";
import { tokenizeCss } from "../../scripts/lib/tokenize.mjs";

const run = (css) => tokenizeCss(css).css;

describe("tokenizeCss", () => {
  it("maps exact token colours", () => {
    expect(run("a{background:#fff;}")).toBe("a{background:var(--surface);}");
    expect(run("a{color:#fff;}")).toBe("a{color:var(--on-primary);}");
    expect(run("a{border:1px solid #edf0f4;}")).toBe("a{border:1px solid var(--border);}");
    expect(run("a{color:#25364a;}")).toBe("a{color:var(--text);}");
    expect(run("a{background:#4d8be8;}")).toBe("a{background:var(--primary);}");
  });

  it("buckets neutral text colours by lightness", () => {
    expect(run("a{color:#34495f;}")).toBe("a{color:var(--text);}");
    expect(run("a{color:#44556a;}")).toBe("a{color:var(--text-soft);}");
    expect(run("a{color:#45596f;}")).toBe("a{color:var(--text-soft);}");
    expect(run("a{color:#5a6b80;}")).toBe("a{color:var(--text-muted);}");
    expect(run("a{color:#92a0ae;}")).toBe("a{color:var(--muted);}");
  });

  it("keeps coloured text (green, purple, warm grey) as it is", () => {
    ["#58ad8b", "#6d63a5", "#a48e81"].forEach((hex) => {
      const css = `a{color:${hex};}`;
      expect(run(css)).toBe(css);
    });
  });

  it("leaves gradients, images, shadows and saturated colours alone", () => {
    const keep = [
      "a{background:linear-gradient(90deg,#fff,#000);}",
      "a{box-shadow:0 1px 2px #1527411a;}",
      "a{background:url(x.png) #fff;}",
      "a{color:#e8767352;}",
      "a{background:#f8ae64;}",
    ];
    keep.forEach((css) => expect(run(css)).toBe(css));
  });

  it("reports what it changed and what is left", () => {
    const r = tokenizeCss("a{color:#fff;background:#f8ae64;}");
    expect(r.replaced).toBe(1);
    expect(r.remaining).toBe(1);
  });
});
