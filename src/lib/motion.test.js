import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const cssFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".css")) cssFiles.push(full);
  }
})(root);

describe("motion", () => {
  it("every stylesheet that moves things also respects reduced motion", () => {
    const offenders = cssFiles
      .filter((file) => {
        const css = fs.readFileSync(file, "utf8");
        const moves = /@keyframes|animation\s*:|animation-name|transition\s*:/.test(css);
        return moves && !/prefers-reduced-motion/.test(css);
      })
      .map((file) => path.relative(root, file));
    expect(offenders).toEqual([]);
  });

  it("only animates cheap properties in keyframes", () => {
    const bad = [];
    for (const file of cssFiles) {
      const css = fs.readFileSync(file, "utf8");
      for (const block of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\n\})\s*\n?/g)) {
        if (/\b(width|height|top|left|right|bottom|margin|padding)\s*:/.test(block[2]))
          bad.push(`${path.relative(root, file)}:${block[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
