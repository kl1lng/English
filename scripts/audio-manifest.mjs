// Writes src/data/audio-manifest.json: the names (without .m4a) of the recordings in public/audio.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(import.meta.dirname, "../public/audio");
const names = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".m4a"))
  .map((f) => f.replace(/\.m4a$/, ""))
  .sort();
fs.writeFileSync(path.resolve(import.meta.dirname, "../src/data/audio-manifest.json"), JSON.stringify(names, null, 2) + "\n");
console.log(`${names.length} recordings listed.`);
