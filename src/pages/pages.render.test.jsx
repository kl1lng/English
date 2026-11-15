import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { lessons } from "../lessons.js";
import { fallbackUser } from "../lib/profile.js";
import Certificate from "./Certificate.jsx";
import Dashboard from "./Dashboard.jsx";
import Journey from "./Journey.jsx";

const noop = () => {};
const gam = {
  status: "ready",
  stats: { xp: 0, freezes: 0, badges: [], dailyGoal: "lesson", tz: "Asia/Oral", extra: {} },
};
const deck = { status: "ready", rows: [] };

describe("pages render without a browser", () => {
  it("Dashboard shows the welcome line and the progress card", () => {
    const html = renderToString(
      <Dashboard
        user={fallbackUser}
        completedCount={6}
        progress={20}
        openLesson={noop}
        navigate={noop}
        setModal={noop}
        setAuthMode={noop}
        token=""
        lessons={lessons}
        deck={deck}
        gam={gam}
        reviewsToday={0}
      />,
    );
    const text = html.replace(/<!-- -->/g, "");
    expect(text).toContain("Hey Antoshka");
    expect(text).toContain("Level 1");
    // The level bar scales with transform (cheap to animate), not with width.
    expect(html).toContain("--p:0");
  });

  it("Dashboard shows today's focus only when there is one", () => {
    const props = {
      user: fallbackUser, completedCount: 6, progress: 20, openLesson: noop, navigate: noop, setModal: noop,
      setAuthMode: noop, token: "", lessons, deck, gam, reviewsToday: 0, startFocus: noop,
    };
    const withFocus = renderToString(<Dashboard {...props} focus={{ tag: "tenses", count: 4, lessonIndexes: [1] }} />).replace(/<!-- -->/g, "");
    expect(withFocus).toContain("Today’s focus");
    expect(withFocus).toContain("Verb tenses");
    expect(withFocus).toContain("4 mistakes");
    const without = renderToString(<Dashboard {...props} focus={null} />);
    expect(without).not.toContain("Today’s focus");
  });

  it("Journey lists the lessons", () => {
    const html = renderToString(
      <Journey
        completed={new Set([0, 1])}
        completedCount={2}
        openLesson={noop}
        progress={7}
        submissions={[]}
      />,
    );
    expect(html).toContain("Welcome to Kazakhstan");
  });

  it("Certificate renders for an unfinished course", () => {
    const html = renderToString(
      <Certificate user={fallbackUser} completedCount={6} setPage={vi.fn()} />,
    );
    expect(html.toLowerCase()).toContain("certificate");
  });
});
