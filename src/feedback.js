export function normalizeWords(value = "") {
  return (
    String(value)
      .toLocaleLowerCase("en")
      .replace(/[’']/g, "")
      .match(/[\p{L}\p{N}]+/gu) || []
  );
}

function tokenMatches(target, spoken) {
  if (spoken === target) return true;
  if (target.length < 4) return false;
  const variants = new Set([
    `${target}s`,
    `${target}es`,
    `${target}ed`,
    `${target}ing`,
  ]);
  if (target.endsWith("e")) {
    variants.add(`${target.slice(0, -1)}ed`);
    variants.add(`${target.slice(0, -1)}ing`);
  }
  if (target.endsWith("y")) {
    variants.add(`${target.slice(0, -1)}ies`);
    variants.add(`${target.slice(0, -1)}ied`);
  }
  return variants.has(spoken);
}

export function detectVocabulary(transcript, targetVocabulary = []) {
  const spoken = normalizeWords(transcript);
  return targetVocabulary.filter((phrase) => {
    const target = normalizeWords(phrase);
    if (!target.length || target.length > spoken.length) return false;
    return spoken.some((_, start) =>
      target.every((word, offset) =>
        tokenMatches(word, spoken[start + offset]),
      ),
    );
  });
}

export function durationFeedback(duration, lesson) {
  const seconds = Math.max(0, Math.round(Number(duration) || 0));
  const minimum = lesson.minimumDurationSeconds;
  const recommended = lesson.recommendedDurationSeconds;
  return {
    seconds,
    minimum,
    recommended,
    met: seconds >= minimum,
  };
}

export function createNoTranscriptFeedback(lesson, duration) {
  const timing = durationFeedback(duration, lesson);
  const nextGoal = timing.met
    ? lesson.nextGoal
    : `Record again and speak for at least ${timing.minimum} seconds. ${lesson.nextGoal}`;
  return {
    strength: "You showed up and completed a speaking practice attempt.",
    duration: timing,
    vocabulary: {
      assessed: false,
      detected: [],
      targetCount: lesson.targetVocabulary.length,
      requiredCount: lesson.minimumVocabulary,
      text: "Not assessed — no transcript was available.",
    },
    content: {
      assessed: false,
      text: "Not assessed — no transcript was available.",
    },
    grammarCorrections: [],
    grammarAssessed: false,
    developmentFeedback:
      lesson.feedbackRules?.tooShort && !timing.met
        ? lesson.feedbackRules.tooShort
        : "Your ideas and grammar were not assessed because no transcript was available.",
    nextGoal,
    limitations:
      "Only recording duration was measured. Vocabulary, content, grammar, fluency, and pronunciation were not assessed.",
    transcriptAvailable: false,
    ai: false,
  };
}

export function createTranscriptFeedback(lesson, duration, transcript) {
  const timing = durationFeedback(duration, lesson);
  const detected = detectVocabulary(transcript, lesson.targetVocabulary);
  const missing = lesson.targetVocabulary.filter(
    (word) => !detected.includes(word),
  );
  const vocabularyMet = detected.length >= lesson.minimumVocabulary;
  let vocabularyText = `${detected.length}/${lesson.minimumVocabulary} required words detected (${detected.length}/${lesson.targetVocabulary.length} target terms).`;
  if (!vocabularyMet) {
    vocabularyText += ` Try adding: ${missing.slice(0, 2).join(", ") || "one more target word"}.`;
  }
  const nextGoal = !timing.met
    ? `Record again and speak for at least ${timing.minimum} seconds. ${lesson.nextGoal}`
    : !vocabularyMet
      ? `Use at least ${lesson.minimumVocabulary} target words. Try: ${missing.slice(0, 2).join(", ")}.`
      : lesson.nextGoal;
  const timingFeedback = timing.met
    ? `You met the ${timing.minimum}-second speaking-time goal.`
    : lesson.feedbackRules?.tooShort ||
      `Your recording is shorter than ${timing.minimum} seconds.`;
  return {
    strength: `Your transcript includes ${detected.length} target words: ${detected.slice(0, 3).join(", ") || "none detected yet"}.`,
    duration: timing,
    vocabulary: {
      assessed: true,
      detected,
      missing,
      targetCount: lesson.targetVocabulary.length,
      requiredCount: lesson.minimumVocabulary,
      met: vocabularyMet,
      text: vocabularyText,
    },
    content: {
      assessed: false,
      text: "Not assessed — the transcript could not be reviewed by the language coach.",
    },
    grammarCorrections: [],
    grammarAssessed: false,
    developmentFeedback: `${timingFeedback} Content and grammar were not assessed.`,
    nextGoal,
    limitations:
      "Vocabulary is counted from the automatic transcript, which may contain recognition errors. Content, grammar, fluency, and pronunciation were not assessed.",
    transcriptAvailable: true,
    ai: false,
  };
}
