import { type CourseItem, type ExamStatus, type QuizAttemptRecord } from '@/data/courses';
import { type StudentProfile } from '@/data/profiles';
import { getTutorMode } from '@/data/tutor-modes';
import { type TutorModeId } from '@/types/tutor';
import { computeCourseScore } from '@/utils/score-calculator';

interface TutorPromptInput {
  profile: StudentProfile;
  courses: CourseItem[];
  course: CourseItem | null;
  mode: TutorModeId;
  quizAttempts: QuizAttemptRecord[];
  upcomingExams: ExamStatus[];
  targetAverage: number;
  /** When true the reply will be spoken aloud, so keep it short and markdown-free. */
  voice: boolean;
}

function describeCourse(course: CourseItem, attempts: QuizAttemptRecord[]): string {
  const summary = computeCourseScore(course, attempts);
  const topics = course.quizzes.map((quiz) => quiz.topic).join(', ');
  return (
    `- ${course.name} (${course.credits} CFU). Topics: ${topics}. ` +
    `Mastery score: ${summary.score}/100 (${summary.statusLabel}). ` +
    `Strongest topic: ${summary.strongTopic}. Weakest topic: ${summary.weakTopic}. ` +
    `Quizzes not yet attempted: ${summary.pendingCount}.`
  );
}

export function buildTutorSystemPrompt(input: TutorPromptInput): string {
  const { profile, courses, course, mode, quizAttempts, upcomingExams, targetAverage, voice } =
    input;
  const modeDef = getTutorMode(mode);

  const courseContext = course
    ? `The session is focused on this course:\n${describeCourse(course, quizAttempts)}`
    : `The student's courses:\n${courses.map((c) => describeCourse(c, quizAttempts)).join('\n')}`;

  const exams = upcomingExams
    .map((exam) => `- ${exam.courseName}: ${exam.date}, ${exam.room} (${exam.status})`)
    .join('\n');

  const formatting = voice
    ? 'This reply will be SPOKEN ALOUD. Use plain conversational sentences, no markdown, no ' +
      'bullet points, no emojis, no code blocks. Keep it under 80 words unless the student asks ' +
      'for more detail. End with a short question when it helps the conversation continue.'
    : 'Format answers with light markdown (short paragraphs, **bold** key terms, bullet lists, ' +
      'and `code` where useful). Keep answers focused and skimmable on a phone screen.';

  return [
    `You are "Tutor", an expert AI university tutor inside a student app.`,
    `Student: ${profile.name}, ${profile.course}, ${profile.yearOfStudy}.`,
    `Bio: ${profile.bio}`,
    `Target graduation average: ${targetAverage}/30.`,
    courseContext,
    exams ? `Upcoming exams:\n${exams}` : '',
    `Session mode: ${modeDef.label}. ${modeDef.instructions}`,
    'Reply in the same language the student uses. Be accurate; if unsure, say so. Never invent ' +
      'exam dates or grades beyond the data above.',
    formatting,
  ]
    .filter(Boolean)
    .join('\n\n');
}
