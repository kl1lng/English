# Project map

Last updated: 2026-11-14.

## Purpose

30english ("Discover Kazakhstan — 30-Day Speaking Booster") is a React/Vite English speaking practice app for adults. It has 30 Kazakhstan-themed lessons, self-registration, saved progress, recorded answers with written feedback, and word pronunciations. There are no children, school accounts or teacher accounts.

## How it fits together

```
Browser (React app, src/)
  ├─ Supabase Auth + `profiles` table ── accounts and saved progress
  ├─ /api/health ─────────────────────── tells the app whether speech feedback is on
  ├─ /api/feedback ───────────────────── recording → Cloudflare Whisper → Groq (or Cloudflare Llama) → written feedback
  ├─ /api/chat ───────────────────────── "Ask your buddy" helper
  └─ /audio/<word>.m4a ───────────────── recorded word pronunciations (static files)
```

- Audio recordings are never stored. Only the feedback text and metadata go into the learner's profile.
- Sign-in is required on entry when Supabase is configured. A new learner starts from zero. The demo profile ("Antoshka") appears only when Supabase is not configured.

## Key paths

- `src/main.jsx` — the whole UI: sign-in gate and auth modal, dashboard, lesson modal, recording, feedback, useful-word cards with the 🔊 button (`speakWord`), profile save and load.
- `src/lessons.js` — the 30 lessons: questions, quick facts, target words (`term`, `kk`, `ru`, `example`), assessment targets.
- `src/feedback.js` — duration and transcript-based feedback; also the duration-only fallback ("Not assessed").
- `src/supabase.js` — Supabase client; `supabaseReady` is false when the two `VITE_` variables are missing.
- `src/styles.css` — all styles.
- `supabase/schema.sql` — `profiles` table, row-level security policies, and the sign-up trigger. Run once per Supabase project.
- `api/health.js`, `api/feedback.js`, `api/chat.js` — Vercel serverless functions.
- `server/cloudflare-ai.js` — Whisper transcription plus text feedback (Groq when `GROQ_API_KEY` is set, otherwise Cloudflare Llama). Shared by `api/feedback.js` and the local server.
- `server/index.js` — local Express API for development and `npm start`. Its `/api/auth/*` and `/api/submissions` routes and the JSON store in `server/data/` are legacy: the frontend no longer uses them.
- `public/audio/` — 181 recorded pronunciations, named by the lowercase word (`launch.m4a`, `local-community.m4a`). Duplicate recordings carry `-2`, `-3` suffixes. The app plays `/audio/<word>.m4a` and falls back to browser speech if the file is missing.
- `.claude/launch.json` — preview configs: `web` (Vite, port 5173) and `api` (Express, port 3001).
- `.env.example` — names of all environment variables. The real `.env` is git-ignored and must never be committed.

## Environment variables

Names only; never write values into the repository.

| Variable | Used for | Where |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Accounts and progress. Public by design, baked into the build, so changing them needs a new build. | Vercel (Config type) and `.env` |
| `GROQ_API_KEY` | Written feedback model | Vercel (Secret) and `.env` |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Whisper transcription (and fallback feedback) | Vercel (Secret) and `.env` |
| `OPENAI_API_KEY` and friends | Optional; chat helper and the `ai` flag in `/api/health` | `.env` only so far |
| `GROQ_FEEDBACK_MODEL`, `CLOUDFLARE_FEEDBACK_MODEL`, `PORT` | Optional overrides | `.env` |

`/api/health` returns `speechFeedback` (true when both Cloudflare variables are set) and `ai` (true only when `OPENAI_API_KEY` is set). The app turns feedback on when `speechFeedback` is true, so `ai: false` on the live site is expected.

## Deployment

- GitHub: `kl1lng/English`, branch `main`. Pushing to `main` should trigger a Vercel production deploy.
- Vercel: project `30english`, team `genius-84b0`, live site `https://30english.vercel.app`.
- Supabase: project `discover-kazakhstan` (organisation `kl1lng's Org`). Auth email confirmation is off. Site URL should be `https://30english.vercel.app`.
- The Supabase free plan allows two active projects. The organisation also holds `DosYm` and `Psychology`, so one of them must stay paused. While `discover-kazakhstan` is paused, sign-in and saving do not work.

## Known gaps and things to check

- `README.md` and `docs/superpowers/` still describe the old school pilot (grades 7–10, teacher cabinet). They are outdated.
- Legacy Express auth and submissions code can be removed.
- Words in the Drive folder "Озвучка 2" that are not in any lesson never appear in the app (for example `crystal-clear`, `symbolise`).
- Kazakh (`kk`) translations in `src/lessons.js` have not been reviewed by a native speaker.
- Real speech feedback on the live site has not been tested end to end after the Vercel variables were added.
- `doc_extract.txt`, `POWERSHELL_GUIDE.txt` and `archive/` are notes and old versions, not part of the app.

## Useful commands

- `npm run dev` — Vite and Express together (http://localhost:5173).
- `npm run dev:web` — Vite only.
- `npm run build` — production frontend build into `dist/`.
- `npm start` — Express serving the built app on port 3001.
