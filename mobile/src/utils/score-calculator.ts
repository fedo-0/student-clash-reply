import { type CourseItem, type QuizAttemptRecord } from '@/data/courses';

export type ScoreStatusLabel = 'Needs work' | 'Stable state' | 'Excellent';

export interface CourseScoreSummary {
  score: number;
  statusLabel: ScoreStatusLabel;
  subtitle: string;
  strongTopic: string;
  weakTopic: string;
  pendingCount: number;
}

export function computeCourseScore(
  course: CourseItem,
  attempts: QuizAttemptRecord[]
): CourseScoreSummary {
  // Map latest attempt per quizId
  const latestByQuiz = new Map<string, QuizAttemptRecord>();
  for (const attempt of attempts) {
    const existing = latestByQuiz.get(attempt.quizId);
    if (!existing || attempt.timestamp >= existing.timestamp) {
      latestByQuiz.set(attempt.quizId, attempt);
    }
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let pendingCount = 0;

  const topicScores: {
    topic: string;
    ratio: number;
    weight: number;
    attempted: boolean;
    timestamp: number;
  }[] = [];

  for (const quiz of course.quizzes) {
    const attempt = latestByQuiz.get(quiz.id);
    if (attempt && attempt.totalCount > 0) {
      const ratio = attempt.correctCount / attempt.totalCount;
      weightedSum += ratio * quiz.weight;
      totalWeight += quiz.weight;
      topicScores.push({
        topic: quiz.topic,
        ratio,
        weight: quiz.weight,
        attempted: true,
        timestamp: attempt.timestamp,
      });
    } else {
      pendingCount += 1;
      topicScores.push({
        topic: quiz.topic,
        ratio: 0,
        weight: quiz.weight,
        attempted: false,
        timestamp: 0,
      });
    }
  }

  const weightedAccuracy = totalWeight > 0 ? weightedSum / totalWeight : 0.5;

  // Compute recent trend from ordered attempts for this course
  const attemptedTopics = [...topicScores]
    .filter((t) => t.attempted)
    .sort((a, b) => a.timestamp - b.timestamp);

  let trendAdjustment = 0;
  if (attemptedTopics.length >= 2) {
    const latest = attemptedTopics[attemptedTopics.length - 1].ratio;
    const previousAvg =
      attemptedTopics
        .slice(0, -1)
        .reduce((acc, item) => acc + item.ratio, 0) /
      (attemptedTopics.length - 1);
    trendAdjustment = (latest - previousAvg) * 12;
  }

  // Coverage factor rewards completing pending quizzes
  const completionRatio =
    course.quizzes.length > 0
      ? (course.quizzes.length - pendingCount) / course.quizzes.length
      : 1;
  const coverageBonus = (completionRatio - 0.75) * 10;

  const rawScore = Math.round(
    weightedAccuracy * 100 + trendAdjustment + coverageBonus
  );
  const score = Math.max(0, Math.min(100, rawScore));

  let statusLabel: ScoreStatusLabel;
  let subtitle: string;

  if (score <= 39) {
    statusLabel = 'Needs work';
    subtitle = 'Focus on core concepts to build momentum';
  } else if (score <= 69) {
    statusLabel = 'Stable state';
    subtitle = "Keep going — you're on track";
  } else {
    statusLabel = 'Excellent';
    subtitle = 'Great mastery — ready for exam day';
  }

  // Strongest topic: highest ratio among attempted (tie-break by weight)
  const sortedForStrong = [...attemptedTopics].sort(
    (a, b) => b.ratio - a.ratio || b.weight - a.weight
  );
  const strongTopic =
    sortedForStrong[0]?.topic ?? course.quizzes[0]?.topic ?? 'Core Fundamentals';

  // Weakest topic to review: lowest ratio among attempted, or first unattempted if all attempted are perfect
  const sortedForWeak = [...attemptedTopics].sort(
    (a, b) => a.ratio - b.ratio || b.weight - a.weight
  );
  const unattempted = topicScores.find((t) => !t.attempted);

  let weakTopic =
    sortedForWeak[0]?.topic ??
    unattempted?.topic ??
    course.quizzes[course.quizzes.length - 1]?.topic ??
    'Advanced Applications';

  if (weakTopic === strongTopic && course.quizzes.length > 1) {
    weakTopic =
      unattempted?.topic ??
      sortedForWeak[sortedForWeak.length - 1]?.topic ??
      course.quizzes[1].topic;
  }

  return {
    score,
    statusLabel,
    subtitle,
    strongTopic,
    weakTopic,
    pendingCount,
  };
}
