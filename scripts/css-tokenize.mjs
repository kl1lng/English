// Usage: node scripts/css-tokenize.mjs [--dry-run]
// Moves raw hex colours in src/*.css and src/components/*.css to design tokens.
import fs from "node:fs";
import path from "node:path";
import { tokenizeCss } from "./lib/tokenize.mjs";

const root = path.resolve(import.meta.dirname, "../src");
const files = [path.join(root, "styles.css")];
for (const f of fs.readdirSync(path.join(root, "components")))
  if (f.endsWith(".css")) files.push(path.join(root, "components", f));

const dry = process.argv.includes("--dry-run");
let total = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const { css, replaced, remaining } = tokenizeCss(before);
  total += replaced;
  console.log(`${path.relative(root, file)}: replaced ${replaced}, raw hex left ${remaining}`);
  if (!dry && css !== before) fs.writeFileSync(file, css);
}
console.log(`${dry ? "Would replace" : "Replaced"} ${total} colours.`);
