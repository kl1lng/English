import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Without Supabase keys the app starts in demo mode, so the whole shell renders without a browser.
describe("App shell", () => {
  it("renders the sidebar, the top bar and the dashboard in demo mode", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.resetModules();
    const { default: App } = await import("./App.jsx");
    const html = renderToString(<App />).replace(/<!-- -->/g, "");
    expect(html).toContain("My dashboard");
    expect(html).toContain("Word review");
    expect(html).toContain("Hey Antoshka");
    // Landmarks and navigation semantics
    expect(html).toContain('class="skip-link" href="#content"');
    expect(html).toContain('<main class="main-area" id="content"');
    expect(html).toContain('<nav class="main-nav" aria-label="Main"');
    expect(html).toMatch(/aria-current="page"/);
    vi.unstubAllEnvs();
  });
});
