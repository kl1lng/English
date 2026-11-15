import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react],
  // Names the service worker's caches, so each build starts with fresh ones.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  server: { proxy: { "/api": "http://localhost:3001" } },
});
