/** Tipi derivati per la UI (composizioni dei tipi DB + risultati dei calcoli in src/lib). */
import type { Course, ExamMatch, ExamPosting, ExamRecord, ExamSession, Mastery, Profile, Topic, TopicPrerequisite } from './database';
import type { ReadinessResult } from '@/lib/readiness';
import type { AffinityResult } from '@/lib/affinity';
import type { TopicDistribution } from '@/lib/classStats';

export interface DemoUser {
  profile: Profile;
  subtitle: string;
}

export interface WeeklyPoint {
  week: string; // YYYY-MM-DD (lunedì)
  label: string; // "12 ott"
  value: number;
}

export interface StudentCourseSummary {
  course: Course;
  topics: Topic[];
  topicPrerequisites: TopicPrerequisite[];
  mastery: Mastery[];
  nextSession: ExamSession | null;
  readiness: ReadinessResult;
  trend: WeeklyPoint[]; // readiness settimanale
}

export interface ExamDetail extends StudentCourseSummary {
  affinity: AffinityResult;
}

export interface CourseAggregates {
  course: Course;
  topics: Topic[];
  studentsCount: number;
  activeStudents7d: number;
  avgReadiness: number;
  readinessTrend: WeeklyPoint[];
  readinessHistogram: { range: string; from: number; count: number }[];
  distributions: TopicDistribution[];
  engagement: { week: string; label: string; events: number; activeStudents: number }[];
  nextSession: ExamSession | null;
  atRiskCount: number;
}

/** Annuncio d'esame come lo vede lo studente. */
export interface ExamPostingView {
  posting: ExamPosting;
  course: Course;
  teacher: Profile | null;
  nextSession: ExamSession | null;
  record: ExamRecord | null;
  match: ExamMatch | null;
  /** readiness attuale se lo studente è iscritto al corso sulla piattaforma */
  readiness: number | null;
}

/** Annuncio d'esame come lo vede il docente (con statistiche aggregate). */
export interface TeacherPostingView {
  posting: ExamPosting;
  course: Course;
  topics: Topic[];
  matchesCount: number;
  avgMatch: number | null;
}

export interface Alert {
  id: string;
  courseId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
}
