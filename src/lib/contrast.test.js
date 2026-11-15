import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast.js";

const css = fs.readFileSync(path.resolve(__dirname, "../styles/tokens.css"), "utf8");

// Reads "--name: #hex;" pairs from the light block (":root {") and the dark block.
function readBlock(selector) {
  const start = css.indexOf(selector);
  if (start < 0) return {};
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}
const light = readBlock(":root {");
const dark = { ...light, ...readBlock('[data-theme="dark"] {') };

const PAIRS = [
  ["text", "bg"], ["text", "surface"], ["text-strong", "surface"], ["text-soft", "surface"],
  ["text-muted", "surface"], ["text-muted", "bg"], ["text-muted", "surface-2"],
  ["muted", "surface"], ["muted", "surface-2"], ["accent-text", "surface"], ["accent-text", "warn-bg"],
  ["link", "surface"], ["link", "surface-2"], ["link", "bg"],
  ["on-primary", "primary-strong"], ["warn-text", "warn-bg"], ["success-strong", "success-bg"],
];

describe("contrastRatio", () => {
  it("matches known values", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#ffffff")).toBeGreaterThan(4.4);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
  });
});

describe("token contrast", () => {
  for (const [name, theme] of [["light", light], ["dark", dark]]) {
    it(`${name} theme: text pairs are at least 4.5:1`, () => {
      const failures = PAIRS.filter(([fg, bg]) => contrastRatio(theme[fg], theme[bg]) < 4.5).map(
        ([fg, bg]) => `${fg} on ${bg}: ${contrastRatio(theme[fg], theme[bg]).toFixed(2)}`,
      );
      expect(failures).toEqual([]);
    });
  }
  it("defines a dark block", () => {
    expect(Object.keys(readBlock('[data-theme="dark"] {')).length).toBeGreaterThan(8);
  });
});
