// Review of the Kazakh translations.
//   node scripts/kk-review.mjs export [file]   writes the table (default docs/kk-review/kk-review.csv)
//   node scripts/kk-review.mjs apply <file>    checks the corrected table and writes src/data/kk-overrides.js
// A native speaker edits only the "kk" column. Nothing else may change.
import fs from "node:fs";
import path from "node:path";
import { lessons } from "../src/lessons/kazakhstan-30.js";
import { exportKkRows, parseCsv, toCsv, validateKkRows } from "../src/lib/kk.js";

const root = path.resolve(import.meta.dirname, "..");
const [command, file] = process.argv.slice(2);

if (command === "export") {
  const target = path.resolve(file || path.join(root, "docs/kk-review/kk-review.csv"));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const rows = exportKkRows(lessons);
  fs.writeFileSync(target, "﻿" + toCsv(rows)); // BOM so spreadsheets read Kazakh letters correctly
  console.log(`${rows.length} words written to ${path.relative(root, target)}`);
} else if (command === "apply" && file) {
  const rows = parseCsv(fs.readFileSync(path.resolve(file), "utf8"));
  const { ok, errors } = validateKkRows(rows, lessons);
  if (!ok) {
    console.error(errors.slice(0, 20).join("\n"));
    if (errors.length > 20) console.error(`... and ${errors.length - 20} more problems.`);
    process.exit(1);
  }
  const original = new Map(exportKkRows(lessons).map((r) => [r.key, r.kk]));
  const overrides = {};
  for (const r of rows) if (r.kk.trim() !== original.get(r.key)) overrides[r.key] = r.kk.trim();
  fs.writeFileSync(path.join(root, "src/data/kk-overrides.js"), "export default " + JSON.stringify(overrides, null, 2) + ";\n");
  console.log(`${Object.keys(overrides).length} translations changed; written to src/data/kk-overrides.js`);
} else {
  console.error("Usage: node scripts/kk-review.mjs export [file] | apply <file>");
  process.exit(1);
}
