import React from "react";
import { WifiOff } from "lucide-react";
import "./states.css";

export default function OfflineBanner({ online }) {
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} aria-hidden="true" />
      <span>You are offline. Your answers are kept and sent when the connection is back.</span>
    </div>
  );
}
