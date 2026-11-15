// Usage: node scripts/css-fonts.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { raiseFontSizes } from "./lib/fonts.mjs";

const root = path.resolve(import.meta.dirname, "../src");
const files = [path.join(root, "styles.css")];
for (const f of fs.readdirSync(path.join(root, "components")))
  if (f.endsWith(".css")) files.push(path.join(root, "components", f));
const dry = process.argv.includes("--dry-run");
let total = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const { css, changed } = raiseFontSizes(before);
  total += changed;
  if (changed) console.log(`${path.relative(root, file)}: ${changed}`);
  if (!dry && css !== before) fs.writeFileSync(file, css);
}
console.log(`${dry ? "Would raise" : "Raised"} ${total} font sizes.`);
