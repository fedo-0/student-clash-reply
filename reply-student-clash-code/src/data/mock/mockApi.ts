/**
 * Implementazione mock di DataApi: tutto in memoria, con un piccolo ritardo simulato.
 * I valori derivati (readiness, affinità, aggregati, gruppi) sono calcolati con le funzioni pure di src/lib.
 */
import type { DataApi, OpportunityWithMatch } from '../api';
import type { Mastery, MatchFeedback, Topic } from '@/types/database';
import type { Alert, CourseAggregates, DemoUser, StudentCourseSummary, WeeklyPoint } from '@/types/domain';
import { generateMockDb, WEEKS, DEMO_TODAY } from './generate';
import { applyEvent } from '@/lib/mastery';
import { computeReadiness } from '@/lib/readiness';
import { computeAffinity } from '@/lib/affinity';
import { classReadiness, readinessHistogram, topicDistributions } from '@/lib/classStats';
import { matchGroups } from '@/lib/matchmaking';
import { stableUuid } from '@/lib/random';
import { round } from '@/lib/utils';

const LATENCY = 180;
const delay = <T,>(value: T, ms = LATENCY): Promise<T> => new Promise((r) => setTimeout(() => r(structuredClone(value)), ms));

const weekLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

export function createMockApi(): DataApi {
  const db = generateMockDb();
  const feedback = new Map<string, MatchFeedback>(); // `${student}:${opp}`

  // ---- helper -------------------------------------------------------------
  const topicsOf = (courseId: string) => db.topics.filter((t) => t.course_id === courseId).sort((a, b) => a.position - b.position);
  const masteryOf = (studentId: string, topics: Topic[]) => {
    const ids = new Set(topics.map((t) => t.id));
    return db.mastery.filter((m) => m.student_id === studentId && ids.has(m.topic_id));
  };
  const studentsOf = (courseId: string) => db.enrollments.filter((e) => e.course_id === courseId && e.active).map((e) => e.student_id);
  const nextSessionOf = (courseId: string) =>
    db.examSessions.filter((s) => s.course_id === courseId && new Date(s.date) >= DEMO_TODAY).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  /** Mastery "come era" a fine settimana, ricostruito dagli snapshot. */
  const snapshotMastery = (studentId: string, topics: Topic[], week: string): Mastery[] => {
    const ids = new Set(topics.map((t) => t.id));
    return db.masterySnapshots
      .filter((s) => s.student_id === studentId && s.week_start === week && ids.has(s.topic_id))
      .map((s) => ({ ...s, events_count: 1, updated_at: s.created_at }));
  };

  const readinessTrend = (studentId: string, topics: Topic[]): WeeklyPoint[] => {
    const points = WEEKS.map((w) => ({ week: w, label: weekLabel(w), value: computeReadiness(topics, snapshotMastery(studentId, topics, w)).readiness }));
    // ultimo punto = stato attuale (include eventi live registrati in sessione)
    points[points.length - 1].value = computeReadiness(topics, masteryOf(studentId, topics)).readiness;
    return points;
  };

  const courseSummary = (studentId: string, courseId: string): StudentCourseSummary => {
    const course = db.courses.find((c) => c.id === courseId)!;
    const topics = topicsOf(courseId);
    const mastery = masteryOf(studentId, topics);
    const topicIds = new Set(topics.map((t) => t.id));
    return {
      course,
      topics,
      topicPrerequisites: db.topicPrerequisites.filter((tp) => topicIds.has(tp.topic_id)),
      mastery,
      nextSession: nextSessionOf(courseId),
      readiness: computeReadiness(topics, mastery),
      trend: readinessTrend(studentId, topics),
    };
  };

  const aggregates = (courseId: string): CourseAggregates => {
    const course = db.courses.find((c) => c.id === courseId)!;
    const topics = topicsOf(courseId);
    const students = studentsOf(courseId);
    const topicIds = new Set(topics.map((t) => t.id));
    const mastery = db.mastery.filter((m) => topicIds.has(m.topic_id));
    const readinessValues = classReadiness(topics, mastery, students);
    const events = db.learningEvents.filter((e) => topicIds.has(e.topic_id));
    const sevenDaysAgo = new Date(DEMO_TODAY.getTime() - 7 * 86400000).toISOString();

    const readinessTrend: WeeklyPoint[] = WEEKS.map((w) => {
      const vals = students.map((sid) => computeReadiness(topics, snapshotMastery(sid, topics, w)).readiness);
      return { week: w, label: weekLabel(w), value: round(vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length), 1) };
    });
    readinessTrend[readinessTrend.length - 1].value = round(readinessValues.reduce((a, b) => a + b, 0) / Math.max(1, readinessValues.length), 1);

    const engagement = WEEKS.map((w, i) => {
      const end = WEEKS[i + 1] ?? '2026-11-09';
      const evs = events.filter((e) => e.created_at >= w && e.created_at < end);
      return { week: w, label: weekLabel(w), events: evs.length, activeStudents: new Set(evs.map((e) => e.student_id)).size };
    });

    return {
      course,
      topics,
      studentsCount: students.length,
      activeStudents7d: new Set(events.filter((e) => e.created_at >= sevenDaysAgo).map((e) => e.student_id)).size,
      avgReadiness: readinessTrend[readinessTrend.length - 1].value,
      readinessTrend,
      readinessHistogram: readinessHistogram(readinessValues),
      distributions: topicDistributions(topics, mastery, students),
      engagement,
      nextSession: nextSessionOf(courseId),
      atRiskCount: readinessValues.filter((r) => r < 40).length,
    };
  };

  const teacherCourseIds = (teacherId: string) => db.courseStaff.filter((s) => s.teacher_id === teacherId).map((s) => s.course_id);

  // ---- API ----------------------------------------------------------------
  return {
    getTenant: () => delay(db.tenant),

    listDemoUsers: () => {
      const pick = [db.meta.keys.giulia, db.meta.keys.rossi, db.meta.keys.bianchi];
      const users: DemoUser[] = pick.map((uid) => {
        const p = db.profiles.find((x) => x.id === uid)!;
        return {
          profile: p,
          subtitle: p.role === 'student' ? `${p.degree_program} · ${p.year}° anno` : p.department ?? '',
        };
      });
      return delay(users, 50);
    },

    getProfile: (userId) => delay(db.profiles.find((p) => p.id === userId) ?? null, 50),

    getStudentCourses: (studentId) =>
      delay(
        db.enrollments
          .filter((e) => e.student_id === studentId && e.active)
          .map((e) => courseSummary(studentId, e.course_id))
          .sort((a, b) => (a.nextSession?.date ?? '9').localeCompare(b.nextSession?.date ?? '9')),
      ),

    getExamDetail: (studentId, courseId) => {
      const summary = courseSummary(studentId, courseId);
      const records = db.examRecords.filter((r) => r.student_id === studentId);
      const prerequisiteCourses = db.prerequisites
        .filter((p) => p.course_id === courseId)
        .map((p) => ({ course: db.courses.find((c) => c.id === p.prerequisite_course_id)!, record: records.find((r) => r.course_id === p.prerequisite_course_id) }));
      const affinity = computeAffinity({
        course: summary.course,
        topics: summary.topics,
        mastery: summary.mastery,
        topicPrerequisites: summary.topicPrerequisites,
        prerequisiteCourses,
        studentSkills: db.studentSkills.filter((s) => s.student_id === studentId),
        relevantSkills: db.meta.relevantSkills[courseId] ?? [],
      });
      return delay({ ...summary, affinity });
    },

    getExamRecords: (studentId) => delay(db.examRecords.filter((r) => r.student_id === studentId)),

    getStudentGoal: (studentId) => delay(db.studentGoals.find((g) => g.student_id === studentId) ?? null),

    updateStudentGoal: async (studentId, patch) => {
      let goal = db.studentGoals.find((g) => g.student_id === studentId);
      if (!goal) {
        goal = { id: stableUuid(`goal:${studentId}`), tenant_id: db.tenant.id, created_at: new Date().toISOString(), student_id: studentId, target_average: null, target_graduation: null, target_date: null, notes: null };
        db.studentGoals.push(goal);
      }
      Object.assign(goal, patch);
      return delay(goal, 80);
    },

    getStudentSkills: (studentId) => delay(db.studentSkills.filter((s) => s.student_id === studentId)),
    getStudentProjects: (studentId) => delay(db.studentProjects.filter((s) => s.student_id === studentId)),

    getLearningEvents: (studentId, courseId) => {
      const ids = courseId ? new Set(topicsOf(courseId).map((t) => t.id)) : null;
      return delay(db.learningEvents.filter((e) => e.student_id === studentId && (!ids || ids.has(e.topic_id))));
    },

    recordLearningEvent: async (ev) => {
      const now = new Date().toISOString();
      db.learningEvents.push({ ...ev, id: stableUuid(`le:${now}:${Math.random()}`), tenant_id: db.tenant.id, created_at: now, source_ref: null });
      let m = db.mastery.find((x) => x.student_id === ev.student_id && x.topic_id === ev.topic_id);
      const next = applyEvent(m ?? null, ev);
      if (m) Object.assign(m, next, { updated_at: now });
      else {
        m = { id: stableUuid(`mastery:${ev.student_id}.${ev.topic_id}`), tenant_id: db.tenant.id, created_at: now, student_id: ev.student_id, topic_id: ev.topic_id, ...next, updated_at: now };
        db.mastery.push(m);
      }
      return delay(m, 60);
    },

    getOpportunities: (studentId) => {
      const profile = db.profiles.find((p) => p.id === studentId)!;
      const skills = new Set(db.studentSkills.filter((s) => s.student_id === studentId).map((s) => s.name.toLowerCase()));
      const roId = db.meta.courseIdByKey.ro;
      const roReadiness = computeReadiness(topicsOf(roId), masteryOf(studentId, topicsOf(roId))).readiness;
      const list: OpportunityWithMatch[] = db.opportunities.map((o) => {
        const reasons: string[] = [];
        let score = 0;
        if (profile.degree_program && o.degree_programs.includes(profile.degree_program)) {
          score += 0.4;
          reasons.push(`Rivolta a studenti di ${profile.degree_program}`);
        }
        // "Ricerca Operativa" non è una skill del profilo: è coperta dal termine di readiness sotto
        const profileSkills = o.skills.filter((s) => s !== 'Ricerca Operativa');
        const matched = profileSkills.filter((s) => skills.has(s.toLowerCase()));
        if (profileSkills.length) {
          score += 0.45 * (matched.length / profileSkills.length);
          if (matched.length) reasons.push(`Usa competenze che hai: ${matched.join(', ')}`);
        } else score += 0.2;
        if (o.skills.includes('Ricerca Operativa')) {
          score += 0.15 * (roReadiness / 100);
          reasons.push(`Collegata a Ricerca Operativa (readiness ${Math.round(roReadiness)}%)`);
        }
        const fb = feedback.get(`${studentId}:${o.id}`) ?? null;
        if (fb === 'not_interested') score *= 0.4;
        return { ...o, score: round(Math.min(1, score), 2), reasons, feedback: fb };
      });
      return delay(list.sort((a, b) => b.score - a.score));
    },

    setOpportunityFeedback: async (studentId, opportunityId, fb) => {
      feedback.set(`${studentId}:${opportunityId}`, fb);
      return delay(undefined, 60);
    },

    getStudyGroup: (studentId, courseId) => {
      const topics = topicsOf(courseId);
      const pool = db.matchmakingPool
        .filter((p) => p.course_id === courseId && p.active)
        .map((p) => ({
          id: p.student_id,
          name: db.profiles.find((x) => x.id === p.student_id)!.full_name,
          availability: p.availability,
          mastery: Object.fromEntries(masteryOf(p.student_id, topics).map((m) => [m.topic_id, m.score])),
        }));
      const groups = matchGroups(pool, topics.map((t) => t.id));
      return delay({ group: groups.find((g) => g.members.some((m) => m.id === studentId)) ?? null, topics });
    },

    getNotifications: (userId) => delay(db.notifications.filter((n) => n.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at))),

    getCourse: (courseId) => delay(db.courses.find((c) => c.id === courseId)!),
    getTopics: (courseId) => delay(topicsOf(courseId)),
    getDocuments: (courseId) => delay(db.documents.filter((d) => d.course_id === courseId)),

    searchChunks: (courseId, query, topicId) => {
      const docs = db.documents.filter((d) => d.course_id === courseId);
      const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const scored = db.documentChunks
        .filter((c) => docs.some((d) => d.id === c.document_id))
        .map((c) => ({
          ...c,
          document_title: docs.find((d) => d.id === c.document_id)!.title,
          _s: (topicId && c.topic_ids.includes(topicId) ? 2 : 0) + words.filter((w) => c.content.toLowerCase().includes(w)).length,
        }))
        .sort((a, b) => b._s - a._s)
        .slice(0, 3)
        .map(({ _s, ...c }) => c);
      return delay(scored, 120);
    },

    getQuizzes: (courseId) => delay(db.quizzes.filter((q) => q.course_id === courseId)),
    getQuizQuestions: (quizId) => delay(db.quizQuestions.filter((q) => q.quiz_id === quizId).sort((a, b) => a.position - b.position)),
    getRoleplayScenarios: (courseId) => delay(db.roleplayScenarios.filter((r) => !courseId || r.course_id === courseId)),

    getTeacherCourses: (teacherId) => {
      const ids = new Set(teacherCourseIds(teacherId));
      // solo corsi con topic (quelli "attivi" sulla piattaforma)
      return delay(db.courses.filter((c) => ids.has(c.id) && db.topics.some((t) => t.course_id === c.id)));
    },

    getCourseAggregates: (courseId) => delay(aggregates(courseId), 250),

    getTeacherAlerts: (teacherId) => {
      const alerts: Alert[] = [];
      for (const cid of teacherCourseIds(teacherId)) {
        if (!db.topics.some((t) => t.course_id === cid)) continue;
        const ag = aggregates(cid);
        const worst = [...ag.distributions].sort((a, b) => b.pctGap - a.pctGap)[0];
        if (worst && worst.pctGap >= 0.35) {
          alerts.push({ id: `gap-${cid}`, courseId: cid, severity: 'critical', title: `${ag.course.name}: lacuna diffusa su ${worst.topicName}`, body: `Il ${Math.round(worst.pctGap * 100)}% della classe è in fascia rossa su un topic che vale il ${Math.round(worst.examWeight * 100)}% dell'esame.` });
        }
        const qs = db.studentQuestions.filter((q) => q.course_id === cid);
        const recent = qs.filter((q) => q.asked_at >= '2026-10-26').length;
        if (recent >= 8) alerts.push({ id: `faq-${cid}`, courseId: cid, severity: 'warning', title: `${ag.course.name}: ${recent} domande al tutor nelle ultime 2 settimane`, body: 'Ci sono nuovi cluster di dubbi senza risposta ufficiale.' });
        if (ag.nextSession) {
          const days = Math.round((new Date(ag.nextSession.date).getTime() - DEMO_TODAY.getTime()) / 86400000);
          if (days <= 45) alerts.push({ id: `exam-${cid}`, courseId: cid, severity: 'info', title: `${ag.course.name}: appello tra ${days} giorni`, body: `Readiness media ${Math.round(ag.avgReadiness)}%, ${ag.atRiskCount} studenti sotto il 40%.` });
        }
      }
      const order = { critical: 0, warning: 1, info: 2 };
      return delay(alerts.sort((a, b) => order[a.severity] - order[b.severity]));
    },

    getStudentQuestions: (courseId) => delay(db.studentQuestions.filter((q) => q.course_id === courseId)),
    getQuestionClusters: (courseId) => delay(db.questionClusters.filter((q) => q.course_id === courseId)),

    setOfficialAnswer: async (clusterId, answer, teacherId) => {
      const c = db.questionClusters.find((q) => q.id === clusterId)!;
      Object.assign(c, { official_answer: answer, answered_by: teacherId, answered_at: new Date().toISOString() });
      return delay(c, 100);
    },

    getExamDrafts: (courseId) => delay(db.examDrafts.filter((d) => d.course_id === courseId)),

    getClassMasteryVectors: (courseId) => {
      const topics = topicsOf(courseId);
      return delay(
        studentsOf(courseId).map((sid, i) => ({
          studentKey: `S${i + 1}`,
          mastery: Object.fromEntries(masteryOf(sid, topics).map((m) => [m.topic_id, m.score])),
        })),
      );
    },
  };
}
