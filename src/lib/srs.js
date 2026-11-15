import { createEmptyCard, fsrs, generatorParameters, Rating, State } from "ts-fsrs";

export { Rating, State };

// Spaced repetition (FSRS). Cards are stored as flat rows with ISO date strings.
const scheduler = fsrs(
  generatorParameters({ request_retention: 0.9, enable_fuzz: true }),
);

export const wordKey = (term) => term.trim().toLowerCase().replace(/\s+/g, "-");

export function newCard(now = new Date()) {
  return cardToRow(createEmptyCard(now));
}

export function cardToRow(card) {
  return {
    due: new Date(card.due).toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? new Date(card.last_review).toISOString() : null,
  };
}

export function rowToCard(row) {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

// Applies a rating (1 Again, 2 Hard, 3 Good, 4 Easy). Does not mutate the input row.
export function reviewRow(row, rating, now = new Date()) {
  const { card } = scheduler.next(rowToCard(row), now, rating);
  return cardToRow(card);
}

export const isNew = (row) => row.state === State.New;
export const isDue = (row, now = new Date()) => new Date(row.due) <= now;

// Chooses the cards for one session: overdue reviews first (most overdue first),
// then new cards, respecting how many were already done today.
export function pickSession(
  rows,
  now = new Date(),
  { size = 10, maxNew = 20, maxReviews = 100, doneNew = 0, doneReviews = 0 } = {},
) {
  const due = rows.filter((r) => !isNew(r) && isDue(r, now));
  due.sort((a, b) => new Date(a.due) - new Date(b.due));
  const fresh = rows.filter(isNew);
  const reviews = due.slice(0, Math.max(0, maxReviews - doneReviews));
  const news = fresh.slice(0, Math.max(0, maxNew - doneNew));
  return [...reviews, ...news].slice(0, size);
}

export function dueCount(rows, now = new Date()) {
  return rows.filter((r) => isNew(r) || isDue(r, now)).length;
}

// Words the learner keeps forgetting: 2+ lapses, or being relearned right now. Never new cards.
// Most lapses first, then the weakest memory (lowest stability).
export function hardWords(rows, n = 10) {
  return rows
    .filter((r) => !isNew(r) && ((r.lapses || 0) >= 2 || r.state === State.Relearning))
    .sort((a, b) => (b.lapses || 0) - (a.lapses || 0) || (a.stability || 0) - (b.stability || 0))
    .slice(0, n);
}

export const pickHardSession = (rows, size = 10) => hardWords(rows, size);
