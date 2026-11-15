import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// public/sw-rules.js is a classic script (the service worker loads it with importScripts).
const code = fs.readFileSync(path.resolve(__dirname, "../../public/sw-rules.js"), "utf8");
const scope = {};
new Function("self", code)(scope);
const { shouldCache } = scope.swRules;
const origin = "https://30english.vercel.app";
const rule = (p, method = "GET", o = origin) => shouldCache(`${origin}${p}`, method, o);

describe("service worker caching rules", () => {
  it("never caches the API", () => {
    expect(rule("/api/health")).toBe("never");
    expect(rule("/api/feedback", "POST")).toBe("never");
    expect(rule("/api/dialogue-summary")).toBe("never");
  });
  it("never caches anything but GET", () => {
    expect(rule("/", "POST")).toBe("never");
    expect(rule("/audio/heritage.m4a", "PUT")).toBe("never");
  });
  it("never caches other sites", () => {
    expect(shouldCache("https://images.unsplash.com/photo-1", "GET", origin)).toBe("never");
    expect(shouldCache("https://api.telegram.org/x", "GET", origin)).toBe("never");
  });
  it("serves recordings, photos and icons from the cache first", () => {
    expect(rule("/audio/heritage.m4a")).toBe("cache-first");
    expect(rule("/photos/day-01-450.webp")).toBe("cache-first");
    expect(rule("/icons/icon-192.png")).toBe("cache-first");
  });
  it("tries the network first for the page and its scripts", () => {
    expect(rule("/")).toBe("network-first");
    expect(rule("/index.html")).toBe("network-first");
    expect(rule("/assets/index-abc123.js")).toBe("network-first");
    expect(rule("/manifest.webmanifest")).toBe("network-first");
  });
  it("leaves unknown paths alone", () => {
    expect(rule("/something-else")).toBe("never");
    expect(rule("/sw.js")).toBe("never");
  });
});
