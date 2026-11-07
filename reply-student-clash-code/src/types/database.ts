/**
 * Tipi riga coerenti con supabase/schema.sql (snake_case come nel DB).
 * Quando il progetto Supabase sarà attivo si possono rigenerare con
 * `supabase gen types typescript` mantenendo questi alias come facciata.
 */

export type UUID = string;
export type Timestamp = string; // ISO 8601
export type DateString = string; // YYYY-MM-DD

// ---- Enum -------------------------------------------------------------------
export type UserRole = 'student' | 'teacher' | 'admin';
export type StaffRole = 'owner' | 'assistant';
export type EventSource = 'quiz' | 'ai_grading' | 'simulation' | 'self_assessment' | 'official_grade';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'open' | 'numeric';
export type QuizStatus = 'draft' | 'review' | 'published' | 'archived';
export type QuestionStatus = 'proposed' | 'approved' | 'rejected';
export type ChatMode = 'tutor' | 'guided_gap' | 'oral_exam' | 'roleplay';
export type ChatRole = 'user' | 'assistant' | 'system';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
export type DocumentKind = 'slides' | 'notes' | 'book' | 'exercises' | 'exam' | 'other';
export type OpportunityKind = 'internship' | 'job' | 'event' | 'scholarship';
export type MatchFeedback = 'interested' | 'not_interested';

interface Base {
  id: UUID;
  created_at: Timestamp;
}
interface Tenanted extends Base {
  tenant_id: UUID;
}

// ---- Identità ---------------------------------------------------------------
export interface Tenant extends Base {
  name: string;
  slug: string;
}

export interface Profile extends Tenanted {
  role: UserRole;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  degree_program: string | null;
  department: string | null;
  year: number | null;
  external_id: string | null;
}

export interface StudentGoal extends Tenanted {
  student_id: UUID;
  target_average: number | null;
  target_graduation: number | null;
  target_date: DateString | null;
  notes: string | null;
}

export interface StudentSkill extends Tenanted {
  student_id: UUID;
  name: string;
  level: number | null; // 1..5
  source: 'manual' | 'cv_ai' | 'project';
}

export interface StudentProject extends Tenanted {
  student_id: UUID;
  title: string;
  description: string | null;
  skills: string[];
  url: string | null;
}

export interface StudentDocument extends Tenanted {
  student_id: UUID;
  kind: 'cv' | 'certificate' | 'other';
  storage_path: string;
  extracted_json: Record<string, unknown> | null;
}

// ---- Didattica --------------------------------------------------------------
export interface Course extends Tenanted {
  code: string;
  name: string;
  degree_program: string | null;
  cfu: number;
  year: number | null;
  semester: number | null;
  description: string | null;
  external_id: string | null;
}

export interface CourseStaff extends Tenanted {
  course_id: UUID;
  teacher_id: UUID;
  role: StaffRole;
}

export interface Enrollment extends Tenanted {
  course_id: UUID;
  student_id: UUID;
  academic_year: string;
  active: boolean;
}

export interface ExamRecord extends Tenanted {
  student_id: UUID;
  course_id: UUID | null;
  course_name: string;
  cfu: number;
  grade: number | null; // 18..30, null = idoneità o non sostenuto
  honors: boolean;
  passed_at: DateString | null; // null = esame ancora da sostenere
  external_id: string | null;
}

export interface ExamSession extends Tenanted {
  course_id: UUID;
  date: Timestamp;
  room: string | null;
  kind: 'written' | 'oral';
  external_id: string | null;
}

export interface Prerequisite extends Tenanted {
  course_id: UUID;
  prerequisite_course_id: UUID;
  mandatory: boolean;
}

// ---- Competenze -------------------------------------------------------------
export interface Topic extends Tenanted {
  course_id: UUID;
  name: string;
  description: string | null;
  exam_weight: number; // 0..1
  position: number;
  module: string | null;
}

export interface TopicPrerequisite extends Tenanted {
  topic_id: UUID;
  prerequisite_topic_id: UUID;
}

export interface LearningEvent extends Tenanted {
  student_id: UUID;
  topic_id: UUID;
  score: number; // 0..100
  difficulty: number; // 0..1
  weight: number; // 0..1
  source: EventSource;
  source_ref: UUID | null;
}

export interface Mastery extends Tenanted {
  student_id: UUID;
  topic_id: UUID;
  score: number; // 0..100
  confidence: number; // 0..1
  events_count: number;
  updated_at: Timestamp;
}

export interface MasterySnapshot extends Tenanted {
  student_id: UUID;
  topic_id: UUID;
  score: number;
  confidence: number;
  week_start: DateString;
}

// ---- Materiali / RAG --------------------------------------------------------
export interface Document extends Tenanted {
  course_id: UUID;
  uploaded_by: UUID | null;
  title: string;
  kind: DocumentKind;
  storage_path: string;
  pages: number | null;
  status: JobStatus;
}

export interface DocumentChunk extends Tenanted {
  document_id: UUID;
  chunk_index: number;
  content: string;
  page: number | null;
  topic_ids: UUID[];
  embedding: number[] | null;
}

export interface Job extends Tenanted {
  kind: 'ingest_document' | 'generate_quiz' | 'predict_exam' | 'cluster_questions';
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  created_by: UUID | null;
  finished_at: Timestamp | null;
}

// ---- Quiz / esami -----------------------------------------------------------
export interface QuizOption {
  id: string;
  text: string;
}

export interface Quiz extends Tenanted {
  course_id: UUID;
  created_by: UUID | null;
  title: string;
  description: string | null;
  status: QuizStatus;
  source_document_ids: UUID[];
  published_at: Timestamp | null;
}

export interface QuizQuestion extends Tenanted {
  quiz_id: UUID;
  position: number;
  type: QuestionType;
  prompt: string;
  options: QuizOption[] | null;
  correct_answer: string[] | boolean | number | string;
  explanation: string | null;
  topic_ids: UUID[];
  difficulty_estimated: number | null;
  difficulty_observed: number | null;
  source_chunk_ids: UUID[];
  status: QuestionStatus;
}

export interface QuizAttempt extends Tenanted {
  quiz_id: UUID;
  student_id: UUID;
  score: number | null;
  started_at: Timestamp;
  finished_at: Timestamp | null;
}

export interface QuizAnswer extends Tenanted {
  attempt_id: UUID;
  question_id: UUID;
  answer: unknown;
  is_correct: boolean | null;
  score: number | null;
  feedback: string | null;
}

export interface Exam extends Tenanted {
  course_id: UUID;
  exam_session_id: UUID | null;
  title: string;
  max_points: number;
  pass_threshold: number;
}

export interface ExamExercise {
  id: string;
  title: string;
  points: number;
  topic_ids: UUID[];
  difficulty: number; // 0..1
}

export interface ExamDraft extends Tenanted {
  exam_id: UUID | null;
  course_id: UUID;
  created_by: UUID | null;
  title: string;
  storage_path: string | null;
  exercises: ExamExercise[];
}

export interface ExamPrediction extends Tenanted {
  exam_draft_id: UUID;
  params: Record<string, unknown>;
  expected_mean: number | null;
  ci_low: number | null;
  ci_high: number | null;
  pass_rate: number | null;
  per_exercise: { exercise_id: string; success_rate: number }[] | null;
  histogram: { bucket: string; count: number }[] | null;
  ai_explanation: string | null;
}

// ---- Interazioni AI ---------------------------------------------------------
export interface Citation {
  document_id: UUID;
  title: string;
  page: number;
  chunk_id?: UUID;
}

export interface ChatSession extends Tenanted {
  student_id: UUID;
  course_id: UUID | null;
  topic_id: UUID | null;
  scenario_id: UUID | null;
  mode: ChatMode;
  title: string | null;
}

export interface ChatMessage extends Tenanted {
  session_id: UUID;
  role: ChatRole;
  content: string;
  citations: Citation[];
}

export interface StudentQuestion extends Tenanted {
  course_id: UUID;
  topic_id: UUID | null;
  cluster_id: UUID | null;
  text: string;
  asked_at: Timestamp;
}

export interface QuestionCluster extends Tenanted {
  course_id: UUID;
  topic_id: UUID | null;
  title: string;
  summary: string | null;
  official_answer: string | null;
  answered_by: UUID | null;
  answered_at: Timestamp | null;
}

/** 1 = base, 2 = intermedia, 3 = avanzata */
export type RoleplayDifficulty = 1 | 2 | 3;
export type RoleplayAttitude = 'gentle' | 'moderate' | 'aggressive';

export interface RoleplayPersona {
  name: string;
  age?: number;
  role: string;
  /** situazione di partenza vista dallo studente */
  context: string;
  /** battuta d'apertura per ciascun atteggiamento */
  opening_lines: Record<RoleplayAttitude, string>;
}

/** Informazione nascosta: emerge solo se lo studente fa la domanda giusta. */
export interface RoleplayFact {
  id: string;
  /** topic del corso allenato da questa informazione */
  topic_id: UUID;
  /** sintesi mostrata nel report */
  fact: string;
  /** come lo dice il personaggio */
  reply: string;
  /** parole che, nella domanda dello studente, fanno emergere il fatto */
  keywords: string[];
  /** livello minimo di difficoltà in cui il fatto è presente */
  level: RoleplayDifficulty;
  /** suggerimento mostrato a difficoltà base */
  hint: string;
}

export interface RubricCriterion {
  criterion: string;
  weight: number;
  description: string;
  /** cosa misura il valutatore */
  focus: 'discovery' | 'communication' | 'relationship' | 'solution';
}

export interface RoleplayScenario extends Tenanted {
  /** materia per cui lo scenario prepara */
  course_id: UUID;
  /** topic del corso allenati dallo scenario */
  topic_ids: UUID[];
  degree_program: string | null;
  title: string;
  description: string | null;
  /** chi interpreta l'AI: cliente, paziente, ... */
  counterpart_label: string;
  /** competenze allenate */
  skills: string[];
  /** a quale situazione professionale prepara */
  prepares_for: string;
  persona: RoleplayPersona;
  hidden_facts: RoleplayFact[];
  /** obiezioni che il personaggio solleva a difficoltà avanzata */
  objections: string[];
  /** parole che indicano una proposta di soluzione da parte dello studente */
  solution_keywords: string[];
  rubric: RubricCriterion[];
  created_by: UUID | null;
}

export interface RoleplayEvaluation extends Tenanted {
  session_id: UUID;
  scenario_id: UUID;
  student_id: UUID;
  total_score: number | null;
  criteria_scores: { criterion: string; score: number; comment: string }[];
  difficulty: RoleplayDifficulty;
  attitude: RoleplayAttitude;
  facts_discovered: string[];
  feedback: string | null;
}

// ---- Ponte / altro ----------------------------------------------------------
export interface Opportunity extends Tenanted {
  kind: OpportunityKind;
  title: string;
  organization: string;
  description: string | null;
  location: string | null;
  skills: string[];
  degree_programs: string[];
  deadline: DateString | null;
  url: string | null;
  embedding: number[] | null;
}

export interface OpportunityMatch extends Tenanted {
  opportunity_id: UUID;
  student_id: UUID;
  score: number;
  reason: string | null;
  feedback: MatchFeedback | null;
}

export interface Notification extends Tenanted {
  user_id: UUID;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: Timestamp | null;
}
