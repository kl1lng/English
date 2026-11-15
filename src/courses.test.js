import { describe, expect, it } from "vitest";
import { courseProgress, courses, DEFAULT_COURSE_ID, getCourse } from "./courses.js";
import { lessons } from "./lessons.js";

const lesson = (id, min = 45) => ({ id, minimumDurationSeconds: min });
const attempt = (cardId, lessonIndex, seconds) => ({ cardId, lessonIndex, recordingDuration: seconds });

describe("courses", () => {
  it("has the Kazakhstan course with the 30 existing lessons, still exported as lessons", () => {
    const course = getCourse();
    expect(course.id).toBe(DEFAULT_COURSE_ID);
    expect(course.lessons).toBe(lessons);
    expect(course.lessons).toHaveLength(30);
    expect(courses.map((c) => c.id)).toContain("kazakhstan-30");
  });

  it("falls back to the default course for missing or unknown ids", () => {
    expect(getCourse(undefined).id).toBe(DEFAULT_COURSE_ID);
    expect(getCourse("nope").id).toBe(DEFAULT_COURSE_ID);
    expect(getCourse("kazakhstan-30").id).toBe("kazakhstan-30");
  });
});

describe("courseProgress", () => {
  const short = { id: "short", title: "Short", lessons: Array.from({ length: 24 }, (_, i) => lesson(`s-${i + 1}`)) };

  it("counts against the length of the course, not 30", () => {
    const submissions = Array.from({ length: 12 }, (_, i) => attempt(`s-${i + 1}`, i, 60));
    expect(courseProgress(short, submissions)).toEqual({ completed: 12, total: 24 });
  });
  it("counts each lesson once, ignores too-short recordings and other courses", () => {
    const submissions = [
      attempt("s-1", 0, 60),
      attempt("s-1", 0, 70), // same lesson again
      attempt("s-2", 1, 10), // too short
      attempt("day-01", 0, 60), // another course
    ];
    expect(courseProgress(short, submissions)).toEqual({ completed: 1, total: 24 });
  });
  it("handles no attempts and attempts without a card id", () => {
    expect(courseProgress(short, [])).toEqual({ completed: 0, total: 24 });
    expect(courseProgress(getCourse(), [{ lessonIndex: 2, recordingDuration: 90 }]).completed).toBe(1);
  });
});
