# Student Pilot: Teacher-Created Accounts and Persistent Progress

## Intent

Prepare 30english for a small, real classroom pilot. A teacher creates student accounts from a roster; students sign in and use the existing speaking lessons; progress is saved between visits; the teacher can review activity and learning records.

## Goals

- Provide one teacher role and student accounts owned by that teacher.
- Let a teacher create accounts in bulk from student names, without public student registration.
- Generate a distinct, easy-to-copy temporary password for each student. Never use a shared classroom password. Store only password hashes and show the generated passwords once to the teacher.
- Persist student accounts, sessions, and submissions in PostgreSQL so Vercel instances share one source of truth.
- Show each student only their own learning data; show the teacher only students they created.
- Report real activity recorded in the app. Do not create seeded progress or imply that offline/estimated scores are online platform activity.
- Preserve the existing transient audio flow: audio is processed and deleted, while any retained transcript follows the documented retention policy.
- Keep the first release on a Preview deployment. Do not connect the database to Production until the owner chooses to launch the pilot there.

## Non-goals

- Public student self-registration, parent accounts, school-wide administrator management, class invitations, or password-reset email.
- Storing or replaying raw student audio.
- Automatically converting approximate teacher recollections into measured scores.
- Production use before the school has reviewed guardian permission, privacy, retention, and deletion procedures.

## User flow

1. The first teacher creates an account through a one-time setup flow protected by a server-side setup code.
2. The teacher signs in and pastes or uploads a roster.
3. The server creates student accounts, chooses unique usernames, generates short per-student temporary passwords, hashes them, and returns a one-time printable/exportable credential sheet.
4. Each student signs in with their username and temporary password, then records real lesson attempts. Existing app feedback behavior and explicit adult permission for AI processing remain in force.
5. The student sees their own progress. The teacher sees their roster, activity days, completed lessons, attempt count, speaking duration, and available assessment feedback. Missing activity remains empty rather than being fabricated.

## Data and access

- Store only the roster fields needed to identify and group students, plus account role, owning teacher, password hash, and creation time.
- Store submissions with student ID, lesson, timestamp, duration, consent/processing metadata, and assessment feedback. Do not store the uploaded audio.
- Retain transcripts only under the existing 90-day rule; allow an authorized teacher to inspect learning progress without exposing session secrets.
- Use server-managed, expiring sessions in secure, HttpOnly, same-site cookies. Enforce ownership and role checks on every teacher and student API route.
- Provide a teacher action to reset a student's temporary password and a way to remove a student account and its associated records.

## Approaches

1. **Keep JSON files and the current in-memory token map.** This works for a single local process, but Vercel functions are ephemeral and separate, so it cannot provide reliable shared accounts or progress.
2. **Use a Vercel Marketplace PostgreSQL integration.** Vercel's current storage docs support Neon and Supabase; a Neon free-plan database can be provisioned from the Vercel CLI and inject its connection string into the project. This matches the existing Vercel host and the relational roster/submission data. **Selected:** Neon Free, Frankfurt region, connected to Preview only. Provisioning is currently awaiting the account owner's acceptance of Neon Marketplace terms.
3. **Move authentication and data to Supabase.** This offers integrated auth and Postgres, but would replace more of the existing custom authentication flow and adds more migration work for this deadline.

## Constraints and implementation calls

- Continue the existing React/Vite frontend and Vercel serverless API layout.
- Use the project's existing `node:crypto` scrypt password hashing; temporary passwords are unique, short, and changeable through teacher reset. No shared `admin` password.
- Replace production reliance on in-memory sessions/local JSON with PostgreSQL-backed user/session/submission records. Keep local JSON mode only for local development if practical.
- Disable public registration on Vercel; student account creation is teacher-only.
- Use one-time teacher bootstrap protected by `PILOT_TEACHER_SETUP_CODE`. The owner supplies this secret through Vercel environment settings; never commit it or send it in chat.
- Keep `DATABASE_URL` and the teacher setup code in Vercel Preview variables. Run schema initialization as a controlled migration, not on every request.
- If the existing UI cannot accommodate teacher/student flows cleanly, add a focused teacher dashboard view rather than changing the lesson experience.

## Acceptance criteria

- A teacher can bootstrap once, sign in, and create multiple student accounts from a roster.
- Duplicate names do not overwrite accounts; usernames are unique and passwords differ.
- Generated credentials are shown only once to the teacher and are not stored in plaintext.
- Students can sign in and save lesson attempts across separate requests/deployments.
- A student cannot view another student's records or any teacher roster endpoint.
- A teacher cannot access another teacher's students.
- Empty/new accounts show zero activity; only actual submissions produce activity statistics.
- Audio is not persisted; transcript retention remains bounded by the existing policy.
- Production remains unchanged until separately configured for launch.

## Open decisions for implementation

- Exact displayed username format and printable credential-sheet layout are implementation choices; preserve Kazakh/Cyrillic names in display and create collision-safe login IDs.
- Class/grade and school fields should be optional during import when not available.
- Confirm the school's appropriate consent and data-retention process before adding real student records to the external database or opening the pilot publicly.
