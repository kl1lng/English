import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { lessons } from "../lessons.js";
import SayIt from "./SayIt.jsx";

describe("SayIt", () => {
  it("shows a word, the privacy note and the controls", () => {
    const html = renderToString(<SayIt pool={lessons[0].words} speakWord={() => {}} />).replace(/<!-- -->/g, "");
    expect(html).toContain("nothing is sent");
    expect(html).toContain("Record yourself");
    expect(html).toContain("Hear the recording");
    expect(html).toContain("1 of 5");
  });
  it("explains when there are too few words", () => {
    const html = renderToString(<SayIt pool={[]} speakWord={() => {}} />);
    expect(html).toContain("Finish a lesson");
  });
});
