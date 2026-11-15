import { lessons as kazakhstan } from "./lessons.js";

// A course is an ordered list of lessons. Lesson ids are unique across courses, so a learner's
// attempts (which store cardId) can be matched to the right course.
export const DEFAULT_COURSE_ID = "kazakhstan-30";

export const courses = [
  { id: DEFAULT_COURSE_ID, title: "Discover Kazakhstan", level: "B1-B2", lessons: kazakhstan },
];

export function getCourse(id) {
  return courses.find((c) => c.id === id) || courses.find((c) => c.id === DEFAULT_COURSE_ID);
}

// How many lessons of the course the learner has finished (each counted once, recording long enough).
export function courseProgress(course, submissions = []) {
  const byId = new Map(course.lessons.map((lesson, index) => [lesson.id, index]));
  const done = new Set();
  for (const s of submissions) {
    let index;
    if (s.cardId) index = byId.get(s.cardId);
    else if (course.id === DEFAULT_COURSE_ID) index = Number(s.lessonIndex); // older attempts have no cardId
    const lesson = course.lessons[index];
    if (!lesson) continue;
    if (Number(s.recordingDuration || 0) >= lesson.minimumDurationSeconds) done.add(index);
  }
  return { completed: done.size, total: course.lessons.length };
}
