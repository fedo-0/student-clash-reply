/**
 * Interfaccia UNICA del data layer. Le pagine non sanno da dove arrivano i dati:
 * VITE_DATA_SOURCE=mock (default) → dati in memoria; =supabase → src/data/supabase (da completare).
 */
import { APP_CONFIG } from '@/config/app';
import type {
  Course, Document, ExamDraft, ExamRecord, LearningEvent, Mastery, Notification, Opportunity, Profile, QuestionCluster,
  Quiz, QuizQuestion, RoleplayScenario, StudentGoal, StudentProject, StudentQuestion, StudentSkill, Tenant, Topic,
  MatchFeedback, DocumentChunk,
} from '@/types/database';
import type { Alert, CourseAggregates, DemoUser, ExamDetail, StudentCourseSummary } from '@/types/domain';
import type { MatchedGroup } from '@/lib/matchmaking';
import type { StudentMasteryVector } from '@/lib/prediction';
import { createMockApi } from './mock/mockApi';
import { createSupabaseApi } from './supabase/supabaseApi';

export interface OpportunityWithMatch extends Opportunity {
  score: number; // 0..1
  reasons: string[];
  feedback: MatchFeedback | null;
}

export interface DataApi {
  // Identità
  getTenant(): Promise<Tenant>;
  listDemoUsers(): Promise<DemoUser[]>;
  getProfile(userId: string): Promise<Profile | null>;

  // Studente
  getStudentCourses(studentId: string): Promise<StudentCourseSummary[]>;
  getExamDetail(studentId: string, courseId: string): Promise<ExamDetail>;
  getExamRecords(studentId: string): Promise<ExamRecord[]>;
  getStudentGoal(studentId: string): Promise<StudentGoal | null>;
  updateStudentGoal(studentId: string, patch: Partial<Pick<StudentGoal, 'target_average' | 'target_graduation'>>): Promise<StudentGoal>;
  getStudentSkills(studentId: string): Promise<StudentSkill[]>;
  getStudentProjects(studentId: string): Promise<StudentProject[]>;
  getLearningEvents(studentId: string, courseId?: string): Promise<LearningEvent[]>;
  /** Registra un evento e aggiorna il mastery (in Supabase lo fa il trigger). */
  recordLearningEvent(ev: Pick<LearningEvent, 'student_id' | 'topic_id' | 'score' | 'difficulty' | 'weight' | 'source'>): Promise<Mastery>;
  getOpportunities(studentId: string): Promise<OpportunityWithMatch[]>;
  setOpportunityFeedback(studentId: string, opportunityId: string, feedback: MatchFeedback): Promise<void>;
  getStudyGroup(studentId: string, courseId: string): Promise<{ group: MatchedGroup | null; topics: Topic[] }>;
  getNotifications(userId: string): Promise<Notification[]>;

  // Corso / materiali
  getCourse(courseId: string): Promise<Course>;
  getTopics(courseId: string): Promise<Topic[]>;
  getDocuments(courseId: string): Promise<Document[]>;
  searchChunks(courseId: string, query: string, topicId?: string): Promise<(DocumentChunk & { document_title: string })[]>;
  getQuizzes(courseId: string): Promise<Quiz[]>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  getRoleplayScenarios(courseId?: string): Promise<RoleplayScenario[]>;

  // Docente (solo aggregati)
  getTeacherCourses(teacherId: string): Promise<Course[]>;
  getCourseAggregates(courseId: string): Promise<CourseAggregates>;
  getTeacherAlerts(teacherId: string): Promise<Alert[]>;
  getStudentQuestions(courseId: string): Promise<StudentQuestion[]>;
  getQuestionClusters(courseId: string): Promise<QuestionCluster[]>;
  setOfficialAnswer(clusterId: string, answer: string, teacherId: string): Promise<QuestionCluster>;
  getExamDrafts(courseId: string): Promise<ExamDraft[]>;
  /** Vettori di mastery anonimi della classe (input della predizione voti). */
  getClassMasteryVectors(courseId: string): Promise<StudentMasteryVector[]>;
}

export const api: DataApi = APP_CONFIG.dataSource === 'supabase' ? createSupabaseApi() : createMockApi();
