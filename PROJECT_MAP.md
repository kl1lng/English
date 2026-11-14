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

## Engagement features (branch `feature/engagement`, not merged yet)

Built on 2026-11-14 following `docs/superpowers/plans/2026-11-14-engagement-and-ai-speaking.md`. Restore point: git tag `restore-before-engagement` (the `main` commit before this work).

- **Word review** (`src/components/Review.jsx`, `src/hooks/useWordCards.js`, `src/lib/srs.js`, `cloze.js`, `deck.js`): FSRS spaced repetition via `ts-fsrs`. Words of completed lessons (153 unique) enter the deck. Card types: flip, fill-the-blank, listening.
- **XP, levels, badges, streak freezes, daily goal** (`src/lib/xp.js`, `badges.js`, `streak.js`, `src/hooks/useGamification.js`, `src/components/Achievements.jsx`). A day counts for the streak with a lesson or 10 word reviews.
- **Speaking partner** (`api/dialogue.js`, `api/dialogue-summary.js`, `server/dialogue.js`, `src/data/scenarios.js`, `src/components/Dialogue.jsx`): voice role-play, 8 scenarios, reply read aloud by the browser voice, review at the end. Only the review is stored.
- **Word games** (`src/components/Games.jsx`, `src/lib/games.js`): match pairs, build the sentence.
- **Server checks**: `server/auth.js` (Supabase `getUser` on every AI call), `server/usage.js` (daily quotas in Supabase). `/api/feedback`, `/api/chat`, `/api/dialogue*` need sign-in.
- **Telegram reminders** (`api/telegram.js`, `api/remind.js`, `server/telegram.js`, `vercel.json` cron): code and unit tests only. Never run against a real bot.
- **Tests**: `npm test` (Vitest). Pure logic and API helpers only; the UI was checked by hand.

SQL migrations to run once, in order, in the Supabase SQL Editor (nothing has been run yet): `supabase/migrations/001_foundation.sql` … `005_telegram.sql`. Until a migration is run, the matching screen shows "not set up yet" and everything else keeps working.

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

New variables for the engagement features (names only): `DAILY_FEEDBACK_LIMIT`, `DAILY_CHAT_LIMIT`, `DAILY_DIALOGUE_SESSIONS`, `DAILY_DIALOGUE_TURNS`, `DAILY_DIALOGUE_SUMMARIES` (optional limits), `AI_DIALOGUE_ENABLED` (set to `false` to switch the speaking partner off), and for reminders `VITE_TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose).

## Deployment

- GitHub: `kl1lng/English`, branch `main`. Pushing to `main` should trigger a Vercel production deploy.
- Vercel: project `30english`, team `genius-84b0`, live site `https://30english.vercel.app`.
- Supabase: project `discover-kazakhstan` (organisation `kl1lng's Org`). Auth email confirmation is off. Site URL should be `https://30english.vercel.app`.
- The Supabase free plan allows two active projects. The organisation also holds `DosYm` and `Psychology`, so one of them must stay paused. While `discover-kazakhstan` is paused, sign-in and saving do not work.

## Continuing in a new chat

- Local folder: `C:\Users\kulda\Documents\Antoshka`. Start the chat in this folder so this file and the code are visible.
- Links:
  - Vercel project: https://vercel.com/genius-84b0/30english
  - Vercel environment variables: https://vercel.com/genius-84b0/30english/settings/environment-variables
  - Vercel deployments: https://vercel.com/genius-84b0/30english/deployments
  - Supabase project `discover-kazakhstan`: https://supabase.com/dashboard/project/ixdaiwifxlvtfzezdupq
  - Supabase organisation (all projects, pause/resume): https://supabase.com/dashboard/org/qtpwasmmeucidxuijiwg
  - GitHub: https://github.com/kl1lng/English
- Pushing: the default SSH key is rejected by GitHub for this repository. A push works with the project's deploy key, passed for that one command only (no git config change):
  `GIT_SSH_COMMAND="ssh -i ~/.ssh/english_github_deploy -o IdentitiesOnly=yes" git push origin main`
- Unpushed work: run `git status` and `git log origin/main..HEAD` to see commits that exist only locally. This map was last committed locally before it was pushed.
- Rules from the owner's settings: do not push, deploy or delete data unless asked. Never print values from `.env` or Vercel secrets. Do not type API keys or tokens into web forms; the owner pastes those. Check changes in the built-in browser before saying they are done.
- Windows: git prints LF/CRLF warnings; they can be ignored.

## Known gaps and things to check

- `README.md` and `docs/superpowers/` still describe the old school pilot (grades 7–10, teacher cabinet). They are outdated. School wording also remains in the AI prompts (`server/cloudflare-ai.js`, `api/chat.js`) and a few UI strings by the owner's request; the cleanup (plan task 0.6) is not done.
- The engagement features have not been tested with a live Supabase project, real AI keys or a real Telegram bot. The speaking partner was only checked through unit tests and the screens; no real recording was sent.
- `vercel.json` adds a daily cron (`/api/remind`, 13:00 UTC). Check that the Vercel plan allows it before merging.
- Custom phrases from the speaking-partner review are not added to the word deck (word cards only support lesson words).
- Streak counts are computed on the client; XP and badges can be edited by the learner. A shared leaderboard would need server-side awarding.
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
