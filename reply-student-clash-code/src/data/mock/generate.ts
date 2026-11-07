/**
 * Generatore deterministico del database mock (seed fisso → demo sempre uguale).
 * Produce righe tipizzate come le tabelle Supabase (src/types/database.ts).
 * Il mastery NON è inventato: è calcolato riproducendo i learning events con src/lib/mastery.ts.
 */
import type {
  ChatMessage, ChatSession, Course, CourseStaff, Document, DocumentChunk, Enrollment, ExamDraft, ExamRecord,
  ExamSession, LearningEvent, MatchmakingPoolEntry, Mastery, MasterySnapshot, Notification, Opportunity,
  OpportunityMatch, Prerequisite, Profile, QuestionCluster, Quiz, QuizQuestion, RoleplayScenario, StudentGoal,
  StudentProject, StudentQuestion, StudentSkill, Tenant, Topic, TopicPrerequisite, EventSource, OpportunityKind,
} from '@/types/database';
import { createRng, gaussian, pick, randInt, shuffle, stableUuid } from '@/lib/random';
import { replayEvents } from '@/lib/mastery';
import { clamp, round } from '@/lib/utils';
import {
  CHUNKS, COURSES, DOCUMENTS, GIULIA_KEY, GIULIA_PROJECTS, GIULIA_RECORDS, GIULIA_SKILLS, OPPORTUNITIES,
  QUESTION_CLUSTERS, ROLEPLAY, STUDENTS, TEACHERS, TENANT,
} from './fixtures';

export const SEED = 20261107;
export const DEMO_TODAY = new Date('2026-11-07T12:00:00+01:00');
/** Lunedì delle 6 settimane di semestre simulate. */
export const WEEKS = ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'];
export const SLOTS = ['lun_pom', 'mar_mat', 'mer_pom', 'gio_mat', 'ven_pom', 'sab_mat'];

const T0 = '2026-09-01T08:00:00.000Z';
const id = (table: string, key: string) => stableUuid(`${table}:${key}`);

export interface MockDb {
  tenant: Tenant;
  profiles: Profile[];
  courses: Course[];
  courseStaff: CourseStaff[];
  enrollments: Enrollment[];
  examRecords: ExamRecord[];
  examSessions: ExamSession[];
  prerequisites: Prerequisite[];
  topics: Topic[];
  topicPrerequisites: TopicPrerequisite[];
  learningEvents: LearningEvent[];
  mastery: Mastery[];
  masterySnapshots: MasterySnapshot[];
  studentGoals: StudentGoal[];
  studentSkills: StudentSkill[];
  studentProjects: StudentProject[];
  documents: Document[];
  documentChunks: DocumentChunk[];
  quizzes: Quiz[];
  quizQuestions: QuizQuestion[];
  examDrafts: ExamDraft[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  studentQuestions: StudentQuestion[];
  questionClusters: QuestionCluster[];
  roleplayScenarios: RoleplayScenario[];
  matchmakingPool: MatchmakingPoolEntry[];
  opportunities: Opportunity[];
  opportunityMatches: OpportunityMatch[];
  notifications: Notification[];
  /** metadati non-DB utili al mock (skill rilevanti per corso, chiavi leggibili) */
  meta: {
    relevantSkills: Record<string, string[]>; // course_id → skill
    keys: { giulia: string; rossi: string; bianchi: string };
    courseIdByKey: Record<string, string>;
    topicIdByKey: Record<string, string>; // `${course}.${topic}` → id
  };
}

export function generateMockDb(): MockDb {
  const rng = createRng(SEED);
  const tenant_id = id('tenants', TENANT.slug);
  const tenant: Tenant = { id: tenant_id, name: TENANT.name, slug: TENANT.slug, created_at: T0 };
  const base = { tenant_id, created_at: T0 };

  // ---- Profili -----------------------------------------------------------
  const profiles: Profile[] = [
    ...TEACHERS.map<Profile>((t) => ({
      ...base, id: id('profiles', t.key), role: 'teacher', full_name: t.full_name, email: t.email, avatar_url: null,
      degree_program: null, department: t.department, year: null, external_id: null,
    })),
    ...STUDENTS.map<Profile>((s) => ({
      ...base, id: id('profiles', s.key), role: 'student', full_name: s.full_name,
      email: `${s.full_name.toLowerCase().replace(/[^a-z]+/g, '.')}@studenti.unidemo.it`, avatar_url: null,
      degree_program: s.degree_program, department: null, year: s.year, external_id: s.external_id,
    })),
  ];
  const giuliaId = id('profiles', GIULIA_KEY);

  // ---- Corsi, staff, topic ----------------------------------------------
  const courseIdByKey: Record<string, string> = {};
  const topicIdByKey: Record<string, string> = {};
  const courses: Course[] = [];
  const courseStaff: CourseStaff[] = [];
  const topics: Topic[] = [];
  const topicPrerequisites: TopicPrerequisite[] = [];
  const prerequisites: Prerequisite[] = [];
  const examSessions: ExamSession[] = [];
  const relevantSkills: Record<string, string[]> = {};

  for (const c of COURSES) {
    const cid = id('courses', c.key);
    courseIdByKey[c.key] = cid;
    relevantSkills[cid] = c.relevantSkills;
    courses.push({ ...base, id: cid, code: c.code, name: c.name, degree_program: c.degree_program, cfu: c.cfu, year: c.year, semester: c.semester, description: c.description, external_id: c.code });
    courseStaff.push({ ...base, id: id('course_staff', c.key), course_id: cid, teacher_id: id('profiles', c.teacher), role: 'owner' });
    c.topics.forEach((t, i) => {
      const tid = id('topics', `${c.key}.${t.key}`);
      topicIdByKey[`${c.key}.${t.key}`] = tid;
      topics.push({ ...base, id: tid, course_id: cid, name: t.name, description: t.description, exam_weight: t.weight, position: i, module: t.module });
    });
    if (c.examDate) {
      examSessions.push({ ...base, id: id('exam_sessions', c.key), course_id: cid, date: c.examDate, room: 'Aula 3B', kind: 'written', external_id: null });
    }
  }
  for (const c of COURSES) {
    for (const t of c.topics) for (const p of t.prereqs ?? []) {
      topicPrerequisites.push({ ...base, id: id('topic_prerequisites', `${c.key}.${t.key}.${p}`), topic_id: topicIdByKey[`${c.key}.${t.key}`], prerequisite_topic_id: topicIdByKey[`${c.key}.${p}`] });
    }
    for (const p of c.prerequisiteCourses) {
      prerequisites.push({ ...base, id: id('prerequisites', `${c.key}.${p}`), course_id: courseIdByKey[c.key], prerequisite_course_id: courseIdByKey[p], mandatory: false });
    }
  }

  // ---- Iscrizioni ---------------------------------------------------------
  const enrollments: Enrollment[] = [];
  for (const c of COURSES) {
    if (c.studentsFilter === 'none') continue;
    for (const s of STUDENTS) {
      const isIng = s.degree_program.startsWith('Ingegneria');
      if ((c.studentsFilter === 'ing') !== isIng) continue;
      enrollments.push({ ...base, id: id('enrollments', `${c.key}.${s.key}`), course_id: courseIdByKey[c.key], student_id: id('profiles', s.key), academic_year: '2026/27', active: true });
    }
  }

  // ---- Learning events (6 settimane) --------------------------------------
  const learningEvents: LearningEvent[] = [];
  const sources: EventSource[] = ['quiz', 'quiz', 'quiz', 'ai_grading', 'self_assessment', 'simulation'];
  for (const s of STUDENTS) {
    const sid = id('profiles', s.key);
    const isGiulia = s.key === GIULIA_KEY;
    const ability = isGiulia ? 74 : clamp(gaussian(rng, 60, 12), 30, 88);
    const engagement = isGiulia ? 0.9 : 0.3 + rng() * 0.7;
    for (const c of COURSES) {
      if (c.studentsFilter === 'none') continue;
      const enrolled = enrollments.some((e) => e.student_id === sid && e.course_id === courseIdByKey[c.key]);
      if (!enrolled) continue;
      for (const t of c.topics) {
        let personal = gaussian(rng, 0, 9);
        // --- La storia di Giulia in Ricerca Operativa
        let forcedEvents: number | null = null;
        if (isGiulia && c.key === 'ro') {
          if (t.key === 'dualita') personal = -20;
          if (t.key === 'sensitivita') personal = -14;
          if (t.key === 'modellazione') personal = 4;
          if (t.key === 'pli') forcedEvents = 1;
          if (t.key === 'flussi') forcedEvents = 0;
        }
        let total = 0;
        WEEKS.forEach((weekStart, w) => {
          if (w < t.startWeek) return;
          const since = w - t.startWeek;
          const decay = since === 0 ? 1 : since === 1 ? 0.7 : 0.4;
          let n = Math.floor(engagement * 3.2 * decay * rng() + (rng() < engagement * decay ? 1 : 0));
          if (forcedEvents != null) n = total < forcedEvents && w === WEEKS.length - 1 ? forcedEvents : 0;
          // gli studenti meno costanti saltano l'ultima settimana (engagement realistico)
          if (!isGiulia && engagement < 0.5 && w === WEEKS.length - 1) n = 0;
          for (let k = 0; k < n; k++) {
            const truth = ability + t.classOffset + personal + 3.5 * since;
            const score = round(clamp(gaussian(rng, truth, 11), 0, 100), 0);
            const day = randInt(rng, 0, w === WEEKS.length - 1 ? 4 : 6);
            const date = new Date(`${weekStart}T00:00:00Z`);
            date.setUTCDate(date.getUTCDate() + day);
            date.setUTCHours(randInt(rng, 8, 21), randInt(rng, 0, 59));
            const source = pick(rng, sources);
            learningEvents.push({
              ...base,
              id: id('learning_events', `${s.key}.${c.key}.${t.key}.${w}.${k}`),
              created_at: date.toISOString(),
              student_id: sid,
              topic_id: topicIdByKey[`${c.key}.${t.key}`],
              score,
              difficulty: round(clamp(0.5 - t.classOffset / 60 + gaussian(rng, 0, 0.08), 0.1, 0.95), 2),
              weight: source === 'self_assessment' ? 0.5 : source === 'simulation' ? 0.9 : 1,
              source,
              source_ref: null,
            });
            total++;
          }
        });
      }
    }
  }
  learningEvents.sort((a, b) => a.created_at.localeCompare(b.created_at));

  // ---- Mastery (calcolato davvero) e snapshot settimanali ----------------
  const mastery: Mastery[] = [];
  const masterySnapshots: MasterySnapshot[] = [];
  const eventsByStudent = new Map<string, LearningEvent[]>();
  for (const e of learningEvents) {
    if (!eventsByStudent.has(e.student_id)) eventsByStudent.set(e.student_id, []);
    eventsByStudent.get(e.student_id)!.push(e);
  }
  for (const [sid, evs] of eventsByStudent) {
    const final = replayEvents(evs);
    for (const [topicId, st] of final) {
      const last = evs.filter((e) => e.topic_id === topicId).at(-1)!;
      mastery.push({ ...base, id: id('mastery', `${sid}.${topicId}`), student_id: sid, topic_id: topicId, ...st, updated_at: last.created_at });
    }
    WEEKS.forEach((weekStart) => {
      const end = new Date(`${weekStart}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 7);
      const snap = replayEvents(evs.filter((e) => e.created_at < end.toISOString()));
      for (const [topicId, st] of snap) {
        masterySnapshots.push({ ...base, id: id('mastery_snapshots', `${sid}.${topicId}.${weekStart}`), student_id: sid, topic_id: topicId, score: st.score, confidence: st.confidence, week_start: weekStart });
      }
    });
  }

  // ---- Libretto, obiettivi, skill, progetti di Giulia --------------------
  const examRecords: ExamRecord[] = GIULIA_RECORDS.map((r, i) => ({
    ...base, id: id('exam_records', `giulia.${i}`), student_id: giuliaId,
    course_id: r.courseKey ? courseIdByKey[r.courseKey] : null, course_name: r.name, cfu: r.cfu,
    grade: r.grade, honors: !!r.honors, passed_at: r.date, external_id: null,
  }));
  const studentGoals: StudentGoal[] = [{ ...base, id: id('student_goals', 'giulia'), student_id: giuliaId, target_average: 27.5, target_graduation: 105, target_date: '2027-10-31', notes: 'Accedere alla magistrale in Ingegneria Gestionale con borsa di merito.' }];
  const studentSkills: StudentSkill[] = GIULIA_SKILLS.map((s) => ({ ...base, id: id('student_skills', `giulia.${s.name}`), student_id: giuliaId, ...s }));
  const studentProjects: StudentProject[] = GIULIA_PROJECTS.map((p, i) => ({ ...base, id: id('student_projects', `giulia.${i}`), student_id: giuliaId, url: null, ...p }));

  // ---- Documenti e chunk -------------------------------------------------
  const documents: Document[] = [];
  for (const [ck, docs] of Object.entries(DOCUMENTS)) {
    const teacherKey = COURSES.find((c) => c.key === ck)!.teacher;
    docs.forEach((d, i) => documents.push({
      ...base, id: id('documents', `${ck}.${i}`), course_id: courseIdByKey[ck], uploaded_by: id('profiles', teacherKey),
      title: d.title, kind: d.kind, storage_path: `courses/${ck}/${i}.pdf`, pages: d.pages, status: 'done',
    }));
  }
  const documentChunks: DocumentChunk[] = CHUNKS.map((ch, i) => ({
    ...base, id: id('document_chunks', `${i}`), document_id: id('documents', `${ch.course}.${ch.doc}`), chunk_index: i,
    content: ch.content, page: ch.page, topic_ids: [topicIdByKey[`${ch.course}.${ch.topic}`]], embedding: null,
  }));

  // ---- Quiz --------------------------------------------------------------
  const quizzes: Quiz[] = [];
  const quizQuestions: QuizQuestion[] = [];
  const rossi = id('profiles', 'rossi');
  const addQuiz = (key: string, course: string, title: string, status: Quiz['status'], published_at: string | null, qs: Omit<QuizQuestion, 'id' | 'tenant_id' | 'created_at' | 'quiz_id' | 'position' | 'source_chunk_ids' | 'status'>[]) => {
    const qid = id('quizzes', key);
    quizzes.push({ ...base, id: qid, course_id: courseIdByKey[course], created_by: rossi, title, description: null, status, source_document_ids: [id('documents', `${course}.1`)], published_at });
    qs.forEach((q, i) => quizQuestions.push({ ...base, ...q, id: id('quiz_questions', `${key}.${i}`), quiz_id: qid, position: i, source_chunk_ids: [], status: 'approved' }));
  };
  const T = (k: string) => topicIdByKey[k];
  addQuiz('ro-dual', 'ro', 'Quiz settimana 3 – Dualità', 'published', '2026-10-16T10:00:00Z', [
    { type: 'single_choice', prompt: 'Il primale è un problema di massimo con 3 vincoli ≤ e 2 variabili ≥ 0. Quante variabili ha il duale?', options: [{ id: 'a', text: '2' }, { id: 'b', text: '3' }, { id: 'c', text: '5' }, { id: 'd', text: '6' }], correct_answer: ['b'], explanation: 'A ogni vincolo del primale corrisponde una variabile duale: 3 vincoli → 3 variabili.', topic_ids: [T('ro.dualita')], difficulty_estimated: 0.3, difficulty_observed: 0.22 },
    { type: 'true_false', prompt: 'Se il primale ha ottimo finito, anche il duale ha ottimo finito con lo stesso valore.', options: null, correct_answer: true, explanation: 'È il teorema della dualità forte.', topic_ids: [T('ro.dualita')], difficulty_estimated: 0.35, difficulty_observed: 0.3 },
    { type: 'single_choice', prompt: 'Un vincolo di uguaglianza nel primale corrisponde nel duale a…', options: [{ id: 'a', text: 'una variabile ≥ 0' }, { id: 'b', text: 'una variabile ≤ 0' }, { id: 'c', text: 'una variabile libera' }, { id: 'd', text: 'un vincolo di uguaglianza' }], correct_answer: ['c'], explanation: 'Vincoli di uguaglianza ↔ variabili libere in segno.', topic_ids: [T('ro.dualita')], difficulty_estimated: 0.5, difficulty_observed: 0.48 },
    { type: 'single_choice', prompt: 'In una coppia di soluzioni ottime, se y₂* > 0 allora…', options: [{ id: 'a', text: 'il secondo vincolo primale è attivo' }, { id: 'b', text: 'x₂* = 0' }, { id: 'c', text: 'il secondo vincolo primale ha scarto positivo' }, { id: 'd', text: 'il duale è illimitato' }], correct_answer: ['a'], explanation: 'Scarti complementari: yᵢ*·(bᵢ − aᵢx*) = 0, quindi yᵢ* > 0 implica vincolo i attivo.', topic_ids: [T('ro.dualita')], difficulty_estimated: 0.45, difficulty_observed: 0.61 },
    { type: 'open', prompt: 'Spiega con parole tue perché il valore di una soluzione ammissibile del duale fornisce un bound per il primale.', options: null, correct_answer: 'Dualità debole: per ogni coppia di soluzioni ammissibili cᵀx ≤ bᵀy (problema di max).', explanation: 'Teorema della dualità debole.', topic_ids: [T('ro.dualita')], difficulty_estimated: 0.6, difficulty_observed: 0.55 },
  ]);
  addQuiz('ro-simplex', 'ro', 'Quiz settimana 2 – Simplesso', 'published', '2026-10-09T10:00:00Z', [
    { type: 'single_choice', prompt: 'In un problema di minimo, la base corrente è ottima se…', options: [{ id: 'a', text: 'tutti i costi ridotti sono ≥ 0' }, { id: 'b', text: 'tutti i costi ridotti sono ≤ 0' }, { id: 'c', text: 'tutti i termini noti sono > 0' }, { id: 'd', text: 'la base è degenere' }], correct_answer: ['a'], explanation: 'Per un minimo nessuna variabile fuori base può migliorare l\'obiettivo.', topic_ids: [T('ro.simplesso')], difficulty_estimated: 0.35, difficulty_observed: 0.28 },
    { type: 'single_choice', prompt: 'Cosa garantisce la regola di Bland?', options: [{ id: 'a', text: 'Convergenza più veloce' }, { id: 'b', text: 'Assenza di cicli' }, { id: 'c', text: 'Soluzione intera' }, { id: 'd', text: 'Unicità dell\'ottimo' }], correct_answer: ['b'], explanation: 'Bland sceglie gli indici minimi ed evita il ciclaggio.', topic_ids: [T('ro.simplesso')], difficulty_estimated: 0.4, difficulty_observed: 0.35 },
    { type: 'true_false', prompt: 'Se tutti i coefficienti della colonna entrante sono ≤ 0 il problema è illimitato.', options: null, correct_answer: true, explanation: 'Non esiste un rapporto minimo: si può crescere indefinitamente.', topic_ids: [T('ro.simplesso')], difficulty_estimated: 0.45, difficulty_observed: 0.4 },
  ]);
  addQuiz('ro-sens', 'ro', 'Bozza – Analisi di sensitività', 'draft', null, [
    { type: 'single_choice', prompt: 'Il prezzo ombra di una risorsa non completamente utilizzata è…', options: [{ id: 'a', text: 'positivo' }, { id: 'b', text: 'zero' }, { id: 'c', text: 'negativo' }, { id: 'd', text: 'indefinito' }], correct_answer: ['b'], explanation: 'Vincolo non attivo → variabile duale nulla.', topic_ids: [T('ro.sensitivita')], difficulty_estimated: 0.4, difficulty_observed: null },
  ]);
  addQuiz('stat-prob', 'stat', 'Quiz – Probabilità condizionata', 'published', '2026-10-02T10:00:00Z', [
    { type: 'single_choice', prompt: 'P(A|B) è uguale a…', options: [{ id: 'a', text: 'P(A∩B)/P(B)' }, { id: 'b', text: 'P(A∩B)/P(A)' }, { id: 'c', text: 'P(A)P(B)' }, { id: 'd', text: 'P(A)+P(B)' }], correct_answer: ['a'], explanation: 'Definizione di probabilità condizionata.', topic_ids: [T('stat.probabilita')], difficulty_estimated: 0.25, difficulty_observed: 0.2 },
  ]);

  // ---- Bozza d'esame (predizione) ----------------------------------------
  const examDrafts: ExamDraft[] = [{
    ...base, id: id('exam_drafts', 'ro-dic'), exam_id: null, course_id: courseIdByKey.ro, created_by: rossi,
    title: 'Scritto 12 dicembre – bozza v2', storage_path: 'courses/ro/drafts/scritto-dic.pdf',
    exercises: [
      { id: 'e1', title: 'Es. 1 – Modellazione di un problema di produzione', points: 6, topic_ids: [T('ro.modellazione')], difficulty: 0.45 },
      { id: 'e2', title: 'Es. 2 – Simplesso in forma tableau', points: 6, topic_ids: [T('ro.simplesso')], difficulty: 0.5 },
      { id: 'e3', title: 'Es. 3 – Duale e scarti complementari', points: 7, topic_ids: [T('ro.dualita'), T('ro.sensitivita')], difficulty: 0.6 },
      { id: 'e4', title: 'Es. 4 – Branch and bound', points: 6, topic_ids: [T('ro.pli')], difficulty: 0.55 },
      { id: 'e5', title: 'Es. 5 – Cammino minimo e flusso massimo', points: 5, topic_ids: [T('ro.grafi'), T('ro.flussi')], difficulty: 0.5 },
    ],
  }];

  // ---- Domande al tutor (anonime) e cluster ------------------------------
  const questionClusters: QuestionCluster[] = [];
  const studentQuestions: StudentQuestion[] = [];
  QUESTION_CLUSTERS.forEach((qc, ci) => {
    const clId = id('question_clusters', `${ci}`);
    questionClusters.push({
      ...base, id: clId, course_id: courseIdByKey[qc.course], topic_id: T(`${qc.course}.${qc.topic}`), title: qc.title, summary: qc.summary,
      official_answer: qc.officialAnswer ?? null, answered_by: qc.officialAnswer ? rossi : null, answered_at: qc.officialAnswer ? '2026-10-30T09:00:00Z' : null,
    });
    qc.questions.forEach((text, qi) => {
      // le domande su dualità si concentrano nelle ultime settimane (trend in crescita)
      const w = qc.topic === 'dualita' ? randInt(rng, 3, 5) : randInt(rng, 1, 5);
      const d = new Date(`${WEEKS[w]}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + randInt(rng, 0, w === 5 ? 4 : 6));
      d.setUTCHours(randInt(rng, 9, 23));
      studentQuestions.push({ ...base, id: id('student_questions', `${ci}.${qi}`), course_id: courseIdByKey[qc.course], topic_id: T(`${qc.course}.${qc.topic}`), cluster_id: clId, text, asked_at: d.toISOString() });
    });
  });

  // ---- Chat di esempio di Giulia ------------------------------------------
  const chatSessions: ChatSession[] = [{ ...base, id: id('chat_sessions', 'giulia.1'), student_id: giuliaId, course_id: courseIdByKey.ro, topic_id: T('ro.dualita'), scenario_id: null, mode: 'tutor', title: 'Regole per costruire il duale', created_at: '2026-11-04T18:20:00Z' }];
  const chatMessages: ChatMessage[] = [
    { ...base, id: id('chat_messages', 'g1'), session_id: chatSessions[0].id, role: 'user', content: 'Come faccio a scrivere il duale se il primale ha vincoli sia ≤ che ≥?', citations: [], created_at: '2026-11-04T18:20:00Z' },
    { ...base, id: id('chat_messages', 'g2'), session_id: chatSessions[0].id, role: 'assistant', content: 'Parti dalla forma del primale: per un problema di max, i vincoli ≤ generano variabili duali ≥ 0, i vincoli ≥ generano variabili duali ≤ 0 e le uguaglianze variabili libere.', citations: [{ document_id: id('documents', 'ro.1'), title: 'Dispensa – Teoria della dualità', page: 7 }], created_at: '2026-11-04T18:20:05Z' },
  ];

  // ---- Roleplay ----------------------------------------------------------
  const roleplayScenarios: RoleplayScenario[] = ROLEPLAY.map((r, i) => ({
    ...base, id: id('roleplay_scenarios', `${i}`), course_id: courseIdByKey[r.course], title: r.title, description: r.description,
    persona: r.persona, hidden_facts: r.hidden_facts, rubric: r.rubric, created_by: null,
  }));

  // ---- Matchmaking pool ---------------------------------------------------
  const matchmakingPool: MatchmakingPoolEntry[] = enrollments
    .filter((e) => e.course_id === courseIdByKey.ro)
    .map((e) => ({
      ...base, id: id('matchmaking_pool', e.id), course_id: e.course_id, student_id: e.student_id, active: true,
      availability: e.student_id === giuliaId ? ['mer_pom', 'gio_mat', 'sab_mat'] : shuffle(rng, SLOTS).slice(0, randInt(rng, 3, 5)),
    }));

  // ---- Opportunità --------------------------------------------------------
  const opportunities: Opportunity[] = OPPORTUNITIES.map((o, i) => ({
    ...base, id: id('opportunities', `${i}`), kind: o.kind as OpportunityKind, title: o.title, organization: o.organization,
    description: o.description, location: o.location, skills: o.skills, degree_programs: o.degree, deadline: o.deadline, url: null, embedding: null,
  }));
  const opportunityMatches: OpportunityMatch[] = [];

  // ---- Notifiche ----------------------------------------------------------
  const notifications: Notification[] = [
    { ...base, id: id('notifications', 'g1'), user_id: giuliaId, kind: 'quiz', title: 'Nuovo quiz: Dualità', body: 'Il prof. Rossi ha pubblicato un quiz sulla dualità.', link: '/student/quiz', read_at: null, created_at: '2026-11-05T10:00:00Z' },
    { ...base, id: id('notifications', 'g2'), user_id: giuliaId, kind: 'faq', title: 'Risposta ufficiale disponibile', body: 'Formato e struttura dell\'esame di Ricerca Operativa.', link: '/student/tutor', read_at: null, created_at: '2026-10-30T09:00:00Z' },
    { ...base, id: id('notifications', 'r1'), user_id: rossi, kind: 'alert', title: 'Lacuna di classe su Dualità', body: 'Oltre metà della classe è in fascia rossa.', link: '/teacher/class', read_at: null, created_at: '2026-11-06T08:00:00Z' },
  ];

  return {
    tenant, profiles, courses, courseStaff, enrollments, examRecords, examSessions, prerequisites, topics, topicPrerequisites,
    learningEvents, mastery, masterySnapshots, studentGoals, studentSkills, studentProjects, documents, documentChunks,
    quizzes, quizQuestions, examDrafts, chatSessions, chatMessages, studentQuestions, questionClusters, roleplayScenarios,
    matchmakingPool, opportunities, opportunityMatches, notifications,
    meta: { relevantSkills, keys: { giulia: giuliaId, rossi, bianchi: id('profiles', 'bianchi') }, courseIdByKey, topicIdByKey },
  };
}
