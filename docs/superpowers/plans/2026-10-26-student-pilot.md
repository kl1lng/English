# Student Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add teacher-managed student accounts and durable progress for the 30english Preview pilot.

**Architecture:** Keep React/Vite and Vercel Functions. Use a Vercel Marketplace Neon PostgreSQL database, server-side role/ownership checks, scrypt password hashes, and expiring HttpOnly cookie sessions. Import the roster through a teacher dashboard; never seed fictitious progress.

**Tech Stack:** Existing React 19, Vite, Node.js 24, Vercel Functions, PostgreSQL through Neon, Node built-in crypto.

**Spec:** `docs/superpowers/specs/2026-10-26-student-pilot-design.md`

## Global Constraints

- Keep roster and progress data out of source control and chat artifacts.
- Use a distinct short temporary password for every student; never use a shared password.
- Restrict first teacher bootstrap with `PILOT_TEACHER_SETUP_CODE`; keep credentials in Vercel Preview environment variables.
- Keep raw audio transient and retain transcripts only for the existing 90-day period.
- Do not seed or mislabel synthetic learning activity as real student results.
- Do not connect the pilot database to Production until the owner chooses to launch there.

## Review Focus

- Duplicate or transliteration-colliding names → check the import endpoint returns unique login IDs without merging records.
- Unauthenticated or wrong-role requests → check teacher/student APIs reject missing or mismatched role sessions.
- Cross-teacher and cross-student IDs → check report queries enforce ownership in SQL and return no foreign records.
- Missing database configuration or temporary database outage → check API returns a safe setup/unavailable message without falling back to ephemeral success.
- Password reset/export → check plaintext credentials are returned only at provisioning/reset time and never written to logs or stored in the database.

---

### Task 1: PostgreSQL schema and shared server helpers

**Files:**
- Create: `api/_lib/db.js`
- Create: `api/_lib/auth.js`
- Create: `db/migrations/001_student_pilot.sql`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- `query(text, params)` connects through `DATABASE_URL` using a serverless-safe Postgres driver.
- `requireSession(request, response)` resolves an expiring cookie session and returns `{ id, role, teacherId }` or sends a safe error.
- `requireRole(role)` protects handlers; teacher queries must always include the owning `teacher_id`.

- [ ] Define teachers/students, submissions, sessions, and schema version tables with foreign keys and required indexes.
- [ ] Implement pooled/serverless database access and transactional migration execution.
- [ ] Implement scrypt verification, opaque random cookie tokens stored only as hashes, secure cookie flags, expiry, and role middleware.
- [ ] Confirm syntax and migration safety by reviewing SQL and using the build after later tasks.

### Task 2: Vercel authentication and teacher roster APIs

**Files:**
- Create: `api/auth/bootstrap.js`
- Create: `api/auth/login.js`
- Create: `api/auth/logout.js`
- Create: `api/me.js`
- Create: `api/teacher/students.js`
- Create: `api/teacher/students/[id].js`
- Create: `api/teacher/report.js`
- Modify: `api/health.js`
- Modify: `api/submissions.js`

**Interfaces:**
- `POST /api/auth/bootstrap` creates exactly one initial teacher, gated by `PILOT_TEACHER_SETUP_CODE` and disabled once a teacher exists.
- `POST /api/auth/login` accepts a username and password and sets a secure session cookie.
- `POST /api/auth/logout` revokes the current session.
- `GET /api/me` returns the current user's role and own summary.
- `GET|POST /api/teacher/students` lists a teacher's roster or bulk-provisions students; POST returns usernames/passwords one time.
- `POST /api/teacher/students/:id/reset-password` resets only a student owned by the current teacher and returns the new password once.
- `GET /api/teacher/report` returns activity and lesson summaries scoped to the teacher's roster.
- `POST /api/submissions` requires a student session and persists metadata/feedback without persisting raw audio.

- [ ] Implement setup, login/logout, current-user, and authorization behavior.
- [ ] Implement bulk account creation with collision-safe login IDs and unique 8-character temporary passwords.
- [ ] Implement roster, password reset, teacher reports, and student submission persistence.
- [ ] Ensure all responses use `Cache-Control: no-store`; avoid logging names, passwords, tokens, or transcripts.

### Task 3: Student and teacher user interface

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Student sign-in posts to `/api/auth/login`; public registration is removed from the hosted pilot flow.
- Teacher setup/sign-in leads to the teacher dashboard only for teacher role.
- Teacher dashboard imports a pasted roster, shows a one-time printable/downloadable credential sheet, and lists per-student real activity.
- Student dashboard remains the existing lesson experience and reads persisted `/api/me` state.

- [ ] Add role-aware sign-in, one-time teacher bootstrap form, and sign-out.
- [ ] Add bulk roster import, duplicate/error handling, and one-time credential export that is not written to browser storage.
- [ ] Add teacher activity summaries and student details with meaningful empty states.
- [ ] Preserve the current student lesson, recording, consent, and feedback flow.

### Task 4: Local compatibility, documentation, and Preview hookup

**Files:**
- Modify: `server/index.js`
- Modify: `README.md`
- Modify: `PROJECT_MAP.md`
- Create: `.vercelignore` only if needed to exclude local data

- [ ] Keep local development usable without committing student or database data.
- [ ] Document the Neon Free Preview resource, `PILOT_TEACHER_SETUP_CODE`, one-time setup, account import, retention, and the Production boundary.
- [ ] After Neon terms are accepted, provision the free database in `fra1` for Preview only and add the teacher setup code as an encrypted Preview variable.
- [ ] Run the schema migration and publish a Preview from the task branch; leave Production untouched.
- [ ] Run `npm run build`, inspect `git diff --check`, and review the diff; report manual pilot checks still needed if no real student session is available.

