/** Hook TanStack Query sopra il data layer: le pagine usano solo questi. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { LearningEvent, MatchFeedback, StudentGoal } from '@/types/database';

export const qk = {
  demoUsers: ['demoUsers'] as const,
  studentCourses: (sid: string) => ['studentCourses', sid] as const,
  examDetail: (sid: string, cid: string) => ['examDetail', sid, cid] as const,
  examRecords: (sid: string) => ['examRecords', sid] as const,
  goal: (sid: string) => ['goal', sid] as const,
  skills: (sid: string) => ['skills', sid] as const,
  projects: (sid: string) => ['projects', sid] as const,
  opportunities: (sid: string) => ['opportunities', sid] as const,
  studyBuddies: (sid: string, cid?: string) => ['studyBuddies', sid, cid ?? 'next'] as const,
  notifications: (uid: string) => ['notifications', uid] as const,
  topics: (cid: string) => ['topics', cid] as const,
  documents: (cid: string) => ['documents', cid] as const,
  quizzes: (cid: string) => ['quizzes', cid] as const,
  quizQuestions: (qid: string) => ['quizQuestions', qid] as const,
  roleplay: (cid?: string) => ['roleplay', cid ?? 'all'] as const,
  teacherCourses: (tid: string) => ['teacherCourses', tid] as const,
  aggregates: (cid: string) => ['aggregates', cid] as const,
  alerts: (tid: string) => ['alerts', tid] as const,
  questions: (cid: string) => ['questions', cid] as const,
  clusters: (cid: string) => ['clusters', cid] as const,
  examDrafts: (cid: string) => ['examDrafts', cid] as const,
  classVectors: (cid: string) => ['classVectors', cid] as const,
};

const enabled = (...v: (string | undefined)[]) => v.every(Boolean);

export const useDemoUsers = () => useQuery({ queryKey: qk.demoUsers, queryFn: () => api.listDemoUsers() });

// ---- Studente ---------------------------------------------------------------
export const useStudentCourses = (sid?: string) =>
  useQuery({ queryKey: qk.studentCourses(sid!), queryFn: () => api.getStudentCourses(sid!), enabled: enabled(sid) });
export const useExamDetail = (sid?: string, cid?: string) =>
  useQuery({ queryKey: qk.examDetail(sid!, cid!), queryFn: () => api.getExamDetail(sid!, cid!), enabled: enabled(sid, cid) });
export const useExamRecords = (sid?: string) =>
  useQuery({ queryKey: qk.examRecords(sid!), queryFn: () => api.getExamRecords(sid!), enabled: enabled(sid) });
export const useStudentGoal = (sid?: string) =>
  useQuery({ queryKey: qk.goal(sid!), queryFn: () => api.getStudentGoal(sid!), enabled: enabled(sid) });
export const useStudentSkills = (sid?: string) =>
  useQuery({ queryKey: qk.skills(sid!), queryFn: () => api.getStudentSkills(sid!), enabled: enabled(sid) });
export const useStudentProjects = (sid?: string) =>
  useQuery({ queryKey: qk.projects(sid!), queryFn: () => api.getStudentProjects(sid!), enabled: enabled(sid) });
export const useOpportunities = (sid?: string) =>
  useQuery({ queryKey: qk.opportunities(sid!), queryFn: () => api.getOpportunities(sid!), enabled: enabled(sid) });
export const useStudyBuddies = (sid?: string, cid?: string) =>
  useQuery({ queryKey: qk.studyBuddies(sid!, cid), queryFn: () => api.getStudyBuddies(sid!, cid), enabled: enabled(sid) });
export const useNotifications = (uid?: string) =>
  useQuery({ queryKey: qk.notifications(uid!), queryFn: () => api.getNotifications(uid!), enabled: enabled(uid) });

export function useUpdateGoal(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<StudentGoal, 'target_average' | 'target_graduation'>>) => api.updateStudentGoal(sid, patch),
    onSuccess: (g) => qc.setQueryData(qk.goal(sid), g),
  });
}

export function useOpportunityFeedback(sid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: MatchFeedback }) => api.setOpportunityFeedback(sid, id, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.opportunities(sid) }),
  });
}

/** Registra un learning event e invalida tutto ciò che dipende dal mastery (studente e docente). */
export function useRecordLearningEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ev: Pick<LearningEvent, 'student_id' | 'topic_id' | 'score' | 'difficulty' | 'weight' | 'source'>) => api.recordLearningEvent(ev),
    onSuccess: () => {
      for (const key of ['studentCourses', 'examDetail', 'aggregates', 'alerts', 'classVectors', 'opportunities']) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

// ---- Corso / materiali --------------------------------------------------------
export const useTopics = (cid?: string) => useQuery({ queryKey: qk.topics(cid!), queryFn: () => api.getTopics(cid!), enabled: enabled(cid) });
export const useDocuments = (cid?: string) => useQuery({ queryKey: qk.documents(cid!), queryFn: () => api.getDocuments(cid!), enabled: enabled(cid) });
export const useQuizzes = (cid?: string) => useQuery({ queryKey: qk.quizzes(cid!), queryFn: () => api.getQuizzes(cid!), enabled: enabled(cid) });
export const useQuizQuestions = (qid?: string) =>
  useQuery({ queryKey: qk.quizQuestions(qid!), queryFn: () => api.getQuizQuestions(qid!), enabled: enabled(qid) });
export const useRoleplayScenarios = (cid?: string) => useQuery({ queryKey: qk.roleplay(cid), queryFn: () => api.getRoleplayScenarios(cid) });

// ---- Docente ------------------------------------------------------------------
export const useTeacherCourses = (tid?: string) =>
  useQuery({ queryKey: qk.teacherCourses(tid!), queryFn: () => api.getTeacherCourses(tid!), enabled: enabled(tid) });
export const useCourseAggregates = (cid?: string) =>
  useQuery({ queryKey: qk.aggregates(cid!), queryFn: () => api.getCourseAggregates(cid!), enabled: enabled(cid) });
export const useTeacherAlerts = (tid?: string) =>
  useQuery({ queryKey: qk.alerts(tid!), queryFn: () => api.getTeacherAlerts(tid!), enabled: enabled(tid) });
export const useStudentQuestions = (cid?: string) =>
  useQuery({ queryKey: qk.questions(cid!), queryFn: () => api.getStudentQuestions(cid!), enabled: enabled(cid) });
export const useQuestionClusters = (cid?: string) =>
  useQuery({ queryKey: qk.clusters(cid!), queryFn: () => api.getQuestionClusters(cid!), enabled: enabled(cid) });
export const useExamDrafts = (cid?: string) =>
  useQuery({ queryKey: qk.examDrafts(cid!), queryFn: () => api.getExamDrafts(cid!), enabled: enabled(cid) });
export const useClassVectors = (cid?: string) =>
  useQuery({ queryKey: qk.classVectors(cid!), queryFn: () => api.getClassMasteryVectors(cid!), enabled: enabled(cid) });

export function useSetOfficialAnswer(cid: string, teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clusterId, answer }: { clusterId: string; answer: string }) => api.setOfficialAnswer(clusterId, answer, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.clusters(cid) }),
  });
}
