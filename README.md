# Discover Kazakhstan — 30-Day Speaking Booster

A student-first speaking practice app for learners in grades 7–10. Its 30 B1-to-B2 daily cards cover Kazakhstan’s places, history, people, traditions, and tourism. Each card includes a quick fact, speaking questions, six vocabulary items with Kazakh and Russian translations and examples, a duration goal, and a card-specific next step.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The development command starts the React/Vite client and Express API together. The API stores account and progress data in `server/data/db.json`; uploaded recordings are temporary and deleted after processing.

For a production-style local run, build and start the API server:

```bash
npm run build
npm start
```

Then open <http://localhost:3001>.

## Optional AI feedback

Copy `.env.example` to `.env`, add a server-side `OPENAI_API_KEY`, and restart the app. Never put the key in frontend code or commit `.env`.

When a key is configured, transcript-based review is optional and requires the student to confirm parent/teacher permission before sending a recording to OpenAI. With permission, the app uses speech-to-text and a language model for content and grammar feedback. The audio file is deleted after processing. Transcript text is kept for up to 90 days and then removed; detected vocabulary, consent status, progress, and feedback remain with the attempt. Without permission or a transcript, only recording duration is assessed, and vocabulary, content, and grammar are explicitly marked as not assessed. Speech recognition can make errors. The app does **not** score pronunciation, speaking rate, or IELTS bands.

On Vercel, `/api/health` and `/api/chat` run as serverless functions. The chat works without an API key using its built-in demo responses. Setting `OPENAI_API_KEY` enables OpenAI chat and incurs separate, usage-based OpenAI charges; Vercel Hobby hosting does not include those model calls. Do not set this key until usage limits and abuse controls are configured.

Without an API key, account, lesson, streak, and certificate flows still work. Feedback reports duration and a next goal without inventing transcript-based scores or corrections.

## What is included

- Student registration and sign-in with class, school, name, and a scrypt-hashed password
- Exactly 30 validated Kazakhstan-themed speaking cards with B1-to-B2 progression
- One active sequential card per calendar day; each lesson has its own speaking-time range
- Short attempts are saved and count toward activity streaks, but a card is complete only after its minimum speaking time is reached
- Multiple attempts on the active card are saved; the next card opens on the next calendar day
- Vocabulary matching normalises case and punctuation and recognises common regular inflections
- Browser recording and playback before submission
- Daily activity streaks calculated in the `Asia/Oral` timezone
- A friendly English-learning chat assistant, including a few offline translation examples
- Progress tracking and a completion certificate
- Responsive dashboard, journey view, microphone permission/error states, and mobile navigation

## Architecture

- **Frontend:** React, Vite, Lucide icons, responsive CSS
- **API:** Express, JSON persistence for the local prototype, Multer for temporary audio uploads
- **AI (optional):** OpenAI speech transcription and age-appropriate text feedback
- **API routes:** `/api/health`, `/api/lessons`, `/api/auth/register`, `/api/auth/login`, `/api/me`, `/api/submissions`, `/api/chat`

Only `/api/health` and `/api/chat` are currently implemented as Vercel functions. The Express routes for accounts, progress, and speaking submissions still require a persistent database and session design before they can safely run on Vercel.

The local JSON store and in-memory sessions are suitable for a prototype, not a multi-server production deployment. Before a public school launch, move account data to a managed database, use durable/expiring sessions, configure HTTPS and allowed origins, add account/data deletion and transcript retention controls, and complete the school’s privacy and guardian-consent review. Keep pronunciation scoring explicitly disabled until a suitable assessment provider is integrated.

## Previous lesson version

The application source from before the Darýn cards and feedback update is preserved in `archive/pre-document-version-2026-10-10/`. Its README describes how to restore the previous frontend and API source without replacing the current database or environment files.

## Product research

The interaction design draws on public patterns from [FluentAnyLang](https://github.com/Jim-Elijah/fluent-any-lang) (short speaking loops, practice statistics, and clear audio-retention expectations), [Cadence](https://github.com/pstepanovum/Cadence) (guided modules alongside an open-topic coach), [Eloq](https://github.com/KashProgramming/Eloq_speaking_coach) (record → transcript → actionable feedback → progress), and [OpenPronounce](https://github.com/Halleck45/OpenPronounce) (the distinction between transcript feedback and actual phoneme-level pronunciation assessment). This app implements its own Kazakhstan-specific lesson content and interface.
