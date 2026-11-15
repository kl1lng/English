// Small helpers shared by the interface.
import { dayKey } from "./time.js";

export const API = "/api";
export const cx = (...values) => values.filter(Boolean).join(" ");
export const formatTime = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const localDateKey = (date = new Date()) => dayKey(date);
