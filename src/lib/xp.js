// Experience points, levels and the daily goal. Pure functions, no storage here.
export const LEVEL_STARTS = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4500];
const BEYOND_STEP = 1000;

export const XP = {
  lessonFirst: 50,
  lessonRetry: 10,
  dialogue: 20,
  reviewDailyCap: 100,
  streakDay: 5,
  streakDayMaxMultiplier: 7,
};

export function levelFor(xp = 0) {
  const total = Math.max(0, Math.floor(xp));
  let index = 0;
  for (let i = 0; i < LEVEL_STARTS.length; i++) if (total >= LEVEL_STARTS[i]) index = i;
  const last = LEVEL_STARTS.length - 1;
  let start = LEVEL_STARTS[index];
  let next = LEVEL_STARTS[index + 1];
  let level = index + 1;
  if (index === last) {
    const extra = Math.floor((total - start) / BEYOND_STEP);
    level += extra;
    start += extra * BEYOND_STEP;
    next = start + BEYOND_STEP;
  }
  return {
    level,
    xp: total,
    start,
    next,
    pct: Math.round(((total - start) / (next - start)) * 100),
  };
}

// The daily bucket resets when the day changes.
export function normalizeDaily(daily, today) {
  return daily && daily.day === today
    ? daily
    : { day: today, reviewXp: 0, retryDone: false, reviews: 0 };
}

// Returns { xp, daily } for one event. event.type: lesson_first | lesson_retry | review | streak_day.
export function awardFor(event, dailyState, today) {
  const daily = { ...normalizeDaily(dailyState, today) };
  let xp = 0;
  switch (event.type) {
    case "lesson_first":
      xp = XP.lessonFirst;
      break;
    case "lesson_retry":
      if (!daily.retryDone) {
        xp = XP.lessonRetry;
        daily.retryDone = true;
      }
      break;
    case "review": {
      const base = event.rating >= 3 ? 2 : 1;
      xp = Math.max(0, Math.min(base, XP.reviewDailyCap - daily.reviewXp));
      daily.reviewXp += xp;
      daily.reviews += 1;
      break;
    }
    case "dialogue":
      xp = XP.dialogue;
      break;
    case "streak_day":
      xp = XP.streakDay * Math.min(Math.max(1, event.streak || 1), XP.streakDayMaxMultiplier);
      break;
    default:
      break;
  }
  return { xp, daily };
}

export const REVIEW_GOAL_COUNT = 10;

// Progress towards the learner's chosen daily goal.
// goal: "lesson" | "lesson+review".
export function dailyGoalProgress({ goal = "lesson", lessonDone, reviewsToday }) {
  const parts = [{ id: "lesson", done: Boolean(lessonDone), label: "Speak today’s lesson" }];
  if (goal === "lesson+review")
    parts.push({
      id: "review",
      done: reviewsToday >= REVIEW_GOAL_COUNT,
      label: `Review ${REVIEW_GOAL_COUNT} words`,
      progress: Math.min(reviewsToday, REVIEW_GOAL_COUNT),
      total: REVIEW_GOAL_COUNT,
    });
  const doneCount = parts.filter((p) => p.done).length;
  return {
    parts,
    done: doneCount === parts.length,
    pct: Math.round((doneCount / parts.length) * 100),
  };
}

// Does today count as an active day for the streak? A lesson or 10 reviews does.
export const countsForStreak = ({ lessonDone, reviewsToday }) =>
  Boolean(lessonDone) || reviewsToday >= REVIEW_GOAL_COUNT;
