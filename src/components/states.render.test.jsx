import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ErrorBoundary from "./ErrorBoundary.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import Skeleton from "./Skeleton.jsx";

describe("Skeleton", () => {
  it("shows the requested number of lines and marks the area busy", () => {
    const html = renderToString(<Skeleton lines={3} />);
    expect(html.match(/skeleton-line/g)).toHaveLength(3);
    expect(html).toContain('aria-busy="true"');
  });
});

describe("OfflineBanner", () => {
  it("is announced politely when the connection is lost and absent when online", () => {
    const off = renderToString(<OfflineBanner online={false} />);
    expect(off).toContain('role="status"');
    expect(off).toContain("offline");
    expect(renderToString(<OfflineBanner online={true} />)).toBe("");
  });
});

describe("ErrorBoundary", () => {
  it("renders its children normally", () => {
    expect(renderToString(<ErrorBoundary><p>fine</p></ErrorBoundary>)).toContain("fine");
  });
  it("turns a thrown error into a failed state with a recovery button", () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error("x"))).toEqual({ failed: true });
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { failed: true };
    const html = renderToString(boundary.render());
    expect(html).toContain("Reload this page");
    expect(html).toContain('role="alert"');
  });
});
