import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import manifest from "../data/audio-manifest.json";
import { AUDIO_ALIASES, audioBase, audioPath, hasRecording } from "./audio.js";

const audioDir = path.resolve(__dirname, "../../public/audio");

describe("audio files", () => {
  it("every lesson word resolves to an existing recording", () => {
    const missing = lessons
      .flatMap((l) => l.words.map((w) => w.term))
      .filter((term) => !fs.existsSync(path.join(audioDir, `${audioBase(term)}.m4a`)));
    expect(missing).toEqual([]);
  });

  it("uses aliases for recordings named differently from the word", () => {
    expect(audioBase("civilisation")).toBe("civilization");
    expect(audioBase("ingredient")).toBe("ingredients");
    expect(audioBase("archaeological")).toBe("archeological");
    expect(audioBase("capital")).toBe("capital-2day");
    expect(audioBase("former capital")).toBe("former-capital-3day");
  });

  it("falls back to the plain slug and builds the public path", () => {
    expect(audioBase("Local Community")).toBe("local-community");
    expect(audioPath("heritage")).toBe("/audio/heritage.m4a");
  });

  it("has exactly the 14 known aliases", () => {
    expect(Object.keys(AUDIO_ALIASES).length).toBe(14);
  });

  it("keeps the recording manifest in sync with public/audio", () => {
    const onDisk = fs.readdirSync(audioDir).filter((f) => f.endsWith(".m4a")).map((f) => f.replace(/\.m4a$/, "")).sort();
    expect(manifest).toEqual(onDisk);
  });

  it("knows which words have a recording", () => {
    expect(hasRecording("heritage")).toBe(true);
    expect(hasRecording("civilisation")).toBe(true);
    expect(hasRecording("zzzz-no-recording")).toBe(false);
  });
});
