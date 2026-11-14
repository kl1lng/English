import { describe, expect, it } from "vitest";
import { chatIdOf, parseStart, reminderText, secretMatches, shouldRemind } from "./telegram.js";

const update = (text, chat = { id: 12345, type: "private" }) => ({ message: { text, chat } });

describe("secretMatches", () => {
  it("accepts only the exact secret", () => {
    expect(secretMatches("abc", "abc")).toBe(true);
    expect(secretMatches("abd", "abc")).toBe(false);
    expect(secretMatches("ab", "abc")).toBe(false);
    expect(secretMatches(undefined, "abc")).toBe(false);
    expect(secretMatches("abc", "")).toBe(false);
    expect(secretMatches("abc", undefined)).toBe(false);
  });
});

describe("parseStart", () => {
  const token = "a".repeat(32);
  it("reads the token from /start in a private chat", () => {
    expect(parseStart(update(`/start ${token}`))).toEqual({ chatId: 12345, token });
    expect(parseStart(update(`/start@MyBot ${token}`))).toEqual({ chatId: 12345, token });
  });
  it("ignores groups, bad tokens and other messages", () => {
    expect(parseStart(update(`/start ${token}`, { id: -100, type: "group" }))).toBeNull();
    expect(parseStart(update("/start short"))).toBeNull();
    expect(parseStart(update("/start bad token here"))).toBeNull();
    expect(parseStart(update("hello"))).toBeNull();
    expect(parseStart({})).toBeNull();
  });
  it("exposes the chat id for replies", () => {
    expect(chatIdOf(update("hi"))).toBe(12345);
    expect(chatIdOf({})).toBeNull();
  });
});

describe("reminders", () => {
  it("mentions the streak only when there is one", () => {
    expect(reminderText({ streak: 5 })).toContain("5-day streak");
    expect(reminderText({ streak: 0 })).not.toContain("streak");
  });
  it("reminds only linked learners who have not practised or been reminded today", () => {
    const today = "2026-11-14";
    expect(shouldRemind({ link: { chat_id: 1, last_sent_on: null }, practisedToday: false, today })).toBe(true);
    expect(shouldRemind({ link: { chat_id: 1, last_sent_on: today }, practisedToday: false, today })).toBe(false);
    expect(shouldRemind({ link: { chat_id: 1, last_sent_on: null }, practisedToday: true, today })).toBe(false);
    expect(shouldRemind({ link: { chat_id: null }, practisedToday: false, today })).toBe(false);
  });
});
