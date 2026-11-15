import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeToggle from "./ThemeToggle.jsx";

describe("ThemeToggle", () => {
  it("offers system, light and dark with an accessible name", () => {
    const html = renderToString(<ThemeToggle />);
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("System");
    expect(html).toContain("Light");
    expect(html).toContain("Dark");
    expect(html.match(/role="radio"/g)).toHaveLength(3);
  });
});
