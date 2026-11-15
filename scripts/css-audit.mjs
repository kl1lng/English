// Lists raw hex colours and tiny font sizes in the project's CSS.
// Usage: node scripts/css-audit.mjs [--strict]   (strict: exit 1 when font sizes < 12px remain)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full);
    else if (name.name.endsWith(".css")) files.push(full);
  }
})(root);

const tokenFile = path.join(root, "styles", "tokens.css");
const hexCount = new Map();
let tiny = 0;
for (const file of files) {
  if (file === tokenFile) continue; // tokens are allowed to hold raw values
  const css = fs.readFileSync(file, "utf8");
  for (const hex of css.match(/#[0-9a-fA-F]{3,8}\b/g) || [])
    hexCount.set(hex.toLowerCase(), (hexCount.get(hex.toLowerCase()) || 0) + 1);
  for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g))
    if (Number(m[1]) < 12) tiny += 1;
}
const top = [...hexCount.entries()].sort((a, b) => b[1] - a[1]);
console.log(`CSS files: ${files.length}`);
console.log(`Raw hex colours: ${top.reduce((n, [, c]) => n + c, 0)} (${top.length} distinct)`);
console.log("Top 30:", top.slice(0, 30).map(([h, c]) => `${h}×${c}`).join("  "));
console.log(`font-size under 12px: ${tiny}`);
if (process.argv.includes("--strict") && tiny > 0) process.exit(1);
