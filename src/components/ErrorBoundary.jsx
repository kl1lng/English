import React from "react";
import "./states.css";

// Catches a crash in one page so the rest of the app (menu, theme) keeps working.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Page crashed:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="error-card" role="alert">
        <h2>Something went wrong on this page</h2>
        <p>Your progress is safe. Reloading usually fixes it.</p>
        <button onClick={() => window.location.reload()}>Reload this page</button>
      </div>
    );
  }
}
