# Project map

## Purpose

30english is a React/Vite English speaking practice app with 30 Kazakhstan-themed lessons, a local Express API, and optional speech feedback.

## Key paths

- `src/main.jsx` — dashboard, lesson flow, recording, and feedback UI.
- `src/lessons.js` — lesson content and per-card assessment targets.
- `src/feedback.js` — duration and transcript-based vocabulary feedback.
- `server/index.js` — local Express API, accounts, persistent local submissions, and chat.
- `server/cloudflare-ai.js` — Cloudflare Whisper transcription and age-appropriate text feedback.
- `api/health.js`, `api/chat.js`, `api/feedback.js` — Vercel serverless endpoints.

## Current deployment behavior

- Vercel can serve the frontend, chat fallback, and transient audio feedback.
- Cloudflare feedback requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in Vercel environment variables.
- Vercel feedback responses are transient; accounts and saved progress still need durable storage and sessions.

## Useful commands

- `npm run dev` — local Vite and Express development servers.
- `npm run build` — production frontend build.
