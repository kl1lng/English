import React, { useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  TreePine,
  X,
} from "lucide-react";
import { API, cx, formatTime, localDateKey } from "../lib/format.js";

export default function ChatPanel({
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  setChatOpen,
}) {
  const endRef = useRef(null);
  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [chatMessages],
  );
  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-avatar">
          <Sparkles size={18} />
          <i />
        </div>
        <div>
          <b>Your speaking buddy</b>
          <small>
            <span className="live-dot" /> Always here to help
          </small>
        </div>
        <button className="icon-btn" onClick={() => setChatOpen(false)}>
          <X size={17} />
        </button>
      </div>
      <div className="chat-suggestion">
        <Sparkles size={13} /> Ask anything about English — no question is too
        small.
      </div>
      <div className="chat-feed">
        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={cx(
              "chat-message",
              m.role === "user" ? "from-user" : "from-buddy",
            )}
          >
            {m.loading ? <span className="typing">···</span> : m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="quick-prompts">
        <button
          onClick={() =>
            setChatInput("How do I say “Бұл жер өте әдемі” in English?")
          }
        >
          Translate a sentence
        </button>
        <button
          onClick={() => setChatInput("What does “cultural heritage” mean?")}
        >
          Explain a word
        </button>
      </div>
      <form className="chat-input" onSubmit={sendChat}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Write your question…"
        />
        <button type="submit" disabled={!chatInput.trim()}>
          <Send size={16} />
        </button>
      </form>
      <div className="chat-foot">
        A kind place to practise <TreePine size={13} />
      </div>
    </div>
  );
}
