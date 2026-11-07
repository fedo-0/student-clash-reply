/**
 * Interfaccia AI UNICA. Oggi: risposte mock credibili (ritardo simulato + streaming finto).
 * Domani: ogni metodo chiamerà una Supabase Edge Function (es. supabase.functions.invoke('ai-chat'))
 * che parla con il provider LLM scelto. NESSUNA chiave API nel frontend.
 *
 * Regola: i numeri (mastery, readiness, Monte Carlo, ...) li calcola src/lib; l'LLM scrive solo testo.
 */
import type { ChatMode, Citation, QuestionType, RoleplayScenario, Topic } from '@/types/database';
import type { TopicDistribution } from '@/lib/classStats';
import type { PredictionResult } from '@/lib/prediction';
import type { ReadinessResult } from '@/lib/readiness';
import type { GradeSimulation } from '@/lib/grades';
import { api } from '@/data/api';
import { round } from '@/lib/utils';

// ---- Tipi -------------------------------------------------------------------
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  mode: ChatMode;
  courseId: string;
  topic?: Topic;
  history: ChatTurn[];
  message: string;
}

export type ChatChunk = { type: 'token'; value: string } | { type: 'citations'; value: Citation[] } | { type: 'done' };

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  minutes: number;
  action: 'tutor' | 'quiz' | 'simulation' | 'group' | 'review';
  link: string;
}

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: { id: string; text: string }[] | null;
  correct: string;
  explanation: string;
  difficulty: number;
  topic: string;
  source: { title: string; page: number };
}

export interface LessonSuggestion {
  topic: string;
  insight: string;
  suggestion: string;
  example: string;
}

export interface RoleplayReport {
  totalScore: number;
  criteria: { criterion: string; score: number; comment: string }[];
  factsDiscovered: string[];
  factsMissed: string[];
  feedback: string;
}

export interface AiClient {
  chatStream(req: ChatRequest): AsyncGenerator<ChatChunk>;
  recommendations(ctx: { studentName: string; courses: { id: string; name: string; readiness: ReadinessResult; daysToExam: number | null }[] }): Promise<Recommendation[]>;
  gradesComment(ctx: { sim: GradeSimulation; target: number; readinessByCourse: { name: string; readiness: number }[] }): Promise<string>;
  examAdvice(ctx: { courseName: string; readiness: ReadinessResult; daysToExam: number | null }): Promise<string>;
  proposeTopicsFromPdf(fileName: string, courseTopics: Topic[]): Promise<{ topic: Topic; coverage: number }[]>;
  generateQuiz(req: { topics: Topic[]; count: number; types: QuestionType[]; difficulty: number; documentTitle: string }): Promise<GeneratedQuestion[]>;
  gradeAnswer(req: { question: string; expected: string; answer: string }): Promise<{ score: number; feedback: string }>;
  explainPrediction(req: { result: PredictionResult; examTitle: string; topicNames: Record<string, string>; exerciseTopics: Record<string, string[]> }): Promise<string>;
  lessonSuggestions(req: { courseName: string; distributions: TopicDistribution[] }): Promise<LessonSuggestion[]>;
  summarizeCluster(req: { title: string; questions: string[] }): Promise<string>;
  roleplayReply(req: { scenario: RoleplayScenario; history: ChatTurn[]; message: string }): AsyncGenerator<string>;
  evaluateRoleplay(req: { scenario: RoleplayScenario; history: ChatTurn[] }): Promise<RoleplayReport>;
  extractCvSkills(fileName: string): Promise<{ name: string; level: number }[]>;
}

// ---- Helper mock ------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function* streamText(text: string, speed = 14): AsyncGenerator<string> {
  const parts = text.split(/(\s+)/);
  for (const p of parts) {
    await sleep(speed + Math.random() * speed);
    yield p;
  }
}
const daysLabel = (d: number | null) => (d == null ? 'senza appello fissato' : `tra ${d} giorni`);

// ---- Implementazione mock ---------------------------------------------------
const mockClient: AiClient = {
  async *chatStream({ mode, courseId, topic, message, history }) {
    const chunks = await api.searchChunks(courseId, message, topic?.id);
    const cites: Citation[] = chunks.map((c) => ({ document_id: c.document_id, title: c.document_title, page: c.page ?? 1, chunk_id: c.id }));
    let text: string;
    if (mode === 'guided_gap' && topic) {
      const step = history.filter((h) => h.role === 'user').length;
      text =
        step === 0
          ? `Lavoriamo insieme su **${topic.name}**. Prima di darti la regola, prova tu: ${chunks[0] ? `nei materiali si legge che "${chunks[0].content.slice(0, 90)}…".` : ''}\n\nSe il primale ha 3 vincoli e 2 variabili, **quante variabili avrà il duale secondo te, e perché?**`
          : step === 1
            ? `Esatto il ragionamento di base: a ogni vincolo corrisponde una variabile duale. Ora un passo in più: **che segno avrà la variabile duale associata a un vincolo ≥ in un problema di massimo?** Pensa a cosa succede alla funzione obiettivo se allenti quel vincolo.`
            : `Ottimo lavoro. Ti propongo un esercizio per consolidare: scrivi il duale di\n\nmax 3x₁ + 2x₂\ns.t. x₁ + x₂ ≤ 4, x₁ − x₂ ≥ 1, x₁, x₂ ≥ 0\n\nQuando hai finito incollalo qui: lo valuto e aggiorno il tuo livello su ${topic.name}.`;
    } else if (mode === 'oral_exam') {
      text = `Bene, iniziamo l'interrogazione. ${history.length === 0 ? 'Prima domanda:' : 'Grazie, la risposta è parzialmente corretta. Domanda successiva:'} **enunci il teorema della dualità forte e mi spieghi come si collega agli scarti complementari.** Si prenda il tempo che le serve.`;
    } else {
      const c0 = chunks[0];
      text = c0
        ? `Bella domanda. In sintesi: ${c0.content}\n\n${chunks[1] ? `Aggiungo un collegamento utile: ${chunks[1].content}\n\n` : ''}Vuoi che ti proponga un esercizio guidato su questo punto?`
        : `Non trovo un passaggio preciso nei materiali del corso per questa domanda, quindi ti rispondo in modo generale e ti consiglio di verificarlo con il docente. Prova a riformularla indicando l'argomento (es. "dualità", "simplesso").`;
    }
    await sleep(350);
    for await (const t of streamText(text)) yield { type: 'token', value: t };
    yield { type: 'citations', value: cites };
    yield { type: 'done' };
  },

  async recommendations({ courses }) {
    await sleep(400);
    const recs: Recommendation[] = [];
    const sorted = [...courses].sort((a, b) => (a.daysToExam ?? 999) - (b.daysToExam ?? 999));
    for (const c of sorted) {
      const gap = [...c.readiness.items].filter((i) => i.practiced).sort((a, b) => b.missing - a.missing)[0];
      if (gap && gap.band === 'gap')
        recs.push({ id: `tutor-${gap.topic.id}`, title: `Sessione guidata: ${gap.topic.name}`, reason: `È la tua lacuna più pesante per ${c.name} (${Math.round(gap.score)}/100, vale il ${Math.round(gap.weight * 100)}% dell'esame).`, minutes: 25, action: 'tutor', link: `/student/tutor?course=${c.id}&topic=${gap.topic.id}&mode=guided_gap` });
      const unverified = c.readiness.items.find((i) => i.band === 'unverified');
      if (unverified)
        recs.push({ id: `quiz-${unverified.topic.id}`, title: `Quiz rapido: ${unverified.topic.name}`, reason: unverified.practiced ? 'Hai pochi dati su questo argomento: 10 domande per verificarlo.' : 'Non l\'hai ancora praticato: parti da un quiz diagnostico.', minutes: 10, action: 'quiz', link: `/student/quiz?course=${c.id}&topic=${unverified.topic.id}` });
      if (recs.length >= 3) break;
    }
    recs.push({ id: 'group', title: 'Sessione con il gruppo di studio', reason: 'Mercoledì pomeriggio siete tutti disponibili: chi è forte su Simplesso può aiutare gli altri.', minutes: 60, action: 'group', link: '/student/group' });
    return recs.slice(0, 3);
  },

  async gradesComment({ sim, target, readinessByCourse }) {
    await sleep(500);
    const weak = readinessByCourse.filter((r) => r.readiness < 60).map((r) => r.name);
    if (sim.requiredAverage == null) return `Hai completato tutti gli esami: media finale ${sim.currentAverage}.`;
    const req = sim.requiredAverage;
    return [
      `Per arrivare a ${target.toFixed(1).replace('.', ',')} ti serve una media di **${req.toFixed(2).replace('.', ',')}** sui ${sim.remainingCfu} CFU mancanti.`,
      req > 30 ? 'Con i CFU rimasti l\'obiettivo non è raggiungibile: valuta un obiettivo intermedio.' : req > 28.5 ? 'È un obiettivo ambizioso: servono quasi solo 29-30.' : 'È un obiettivo realistico.',
      weak.length ? `Attenzione a ${weak.join(' e ')}: la tua readiness attuale è sotto il 60%, quindi oggi un voto alto lì non è scontato. Concentrati prima sulle lacune.` : 'La tua preparazione attuale è in linea con l\'obiettivo.',
    ].join(' ');
  },

  async examAdvice({ courseName, readiness, daysToExam }) {
    await sleep(450);
    const gaps = readiness.items.filter((i) => i.band === 'gap').map((i) => i.topic.name);
    const notPracticed = readiness.items.filter((i) => !i.practiced).map((i) => i.topic.name);
    const recoverable = round(readiness.items.filter((i) => i.band !== 'mastered').reduce((s, i) => s + i.missing * 0.5, 0), 0);
    return `Per ${courseName} (${daysLabel(daysToExam)}) sei al ${Math.round(readiness.readiness)}%. ${gaps.length ? `La priorità è ${gaps.join(', ')}: ` : ''}portando i topic non padroneggiati almeno a metà strada recupereresti circa ${recoverable} punti di readiness. ${notPracticed.length ? `Non hai ancora iniziato ${notPracticed.join(', ')}: pianificalo nelle prossime 2 settimane.` : ''}`;
  },

  async proposeTopicsFromPdf(_fileName, courseTopics) {
    await sleep(1200);
    return courseTopics.map((t, i) => ({ topic: t, coverage: round(Math.max(0.1, 0.9 - i * 0.12 + (t.name.includes('Dual') ? 0.3 : 0)), 2) })).sort((a, b) => b.coverage - a.coverage);
  },

  async generateQuiz({ topics, count, types, difficulty, documentTitle }) {
    await sleep(1500);
    const bank: Record<string, { prompt: string; options: string[]; correct: number; explanation: string }[]> = {
      Dualità: [
        { prompt: 'Il primale è un max con vincoli ≤. Il duale è…', options: ['un min con vincoli ≥', 'un max con vincoli ≤', 'un min con vincoli ≤', 'un max con vincoli ≥'], correct: 0, explanation: 'Regola base della costruzione del duale.' },
        { prompt: 'Una variabile primale libera in segno genera nel duale…', options: ['un vincolo di uguaglianza', 'un vincolo ≤', 'una variabile libera', 'nessun vincolo'], correct: 0, explanation: 'Variabili libere ↔ vincoli di uguaglianza.' },
        { prompt: 'Se il duale è illimitato, il primale è…', options: ['inammissibile', 'illimitato', 'con ottimo finito', 'degenere'], correct: 0, explanation: 'Conseguenza della dualità debole.' },
      ],
    };
    const generic = (t: string, i: number) => ({ prompt: `Quale affermazione su "${t}" è corretta? (${i + 1})`, options: ['Affermazione corretta tratta dalle slide', 'Distrattore plausibile basato su un errore comune', 'Distrattore con segno invertito', 'Distrattore fuori argomento'], correct: 0, explanation: `Vedi la definizione in ${documentTitle}.` });
    return Array.from({ length: count }, (_, i) => {
      const t = topics[i % topics.length];
      const type = types[i % types.length];
      const b = bank[t.name]?.[Math.floor(i / topics.length) % (bank[t.name]?.length ?? 1)] ?? generic(t.name, i);
      const ids = ['a', 'b', 'c', 'd'];
      return {
        id: `gen-${Date.now()}-${i}`,
        type,
        prompt: type === 'true_false' ? `Vero o falso: ${b.options[b.correct].toLowerCase()} è la risposta a "${b.prompt}"` : type === 'open' ? `Spiega con parole tue: ${b.prompt}` : b.prompt,
        options: type === 'single_choice' || type === 'multiple_choice' ? b.options.map((text, k) => ({ id: ids[k], text })) : null,
        correct: type === 'true_false' ? 'Vero' : type === 'open' ? b.options[b.correct] : ids[b.correct],
        explanation: b.explanation,
        difficulty: round(Math.min(0.95, Math.max(0.1, difficulty + (i % 3 - 1) * 0.08)), 2),
        topic: t.name,
        source: { title: documentTitle, page: 3 + ((i * 7) % 30) },
      };
    });
  },

  async gradeAnswer({ answer, expected }) {
    await sleep(700);
    const kw = expected.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    const hit = kw.filter((w) => answer.toLowerCase().includes(w)).length;
    const score = Math.round(Math.min(100, 35 + (hit / Math.max(1, kw.length)) * 65 + Math.min(15, answer.length / 20)));
    return { score, feedback: score >= 70 ? 'Risposta corretta e ben argomentata.' : score >= 45 ? 'Ragionamento impostato bene ma incompleto: manca un passaggio chiave.' : 'La risposta non coglie il punto principale: rivedi la definizione nei materiali.' };
  },

  async explainPrediction({ result, examTitle, topicNames, exerciseTopics }) {
    await sleep(900);
    const critical = result.perExercise.filter((e) => e.critical);
    const worst = [...result.perExercise].sort((a, b) => a.successRate - b.successRate)[0];
    const topicsOfWorst = (exerciseTopics[worst.exerciseId] ?? []).map((t) => topicNames[t]).join(' e ');
    return [
      `Con la classe di oggi, "${examTitle}" avrebbe una media attesa di **${result.expectedMean.toString().replace('.', ',')}** (intervallo 90%: ${result.ciLow.toString().replace('.', ',')}–${result.ciHigh.toString().replace('.', ',')}) e circa il **${Math.round(result.passRate * 100)}%** di promossi.`,
      critical.length ? `Gli esercizi critici sono ${critical.map((c) => c.title.split(' – ')[0]).join(', ')}: in particolare ${worst.title.split(' – ')[0]} verrebbe risolto solo dal ${Math.round(worst.successRate * 100)}% degli studenti, perché richiede ${topicsOfWorst}, dove la classe è ancora debole.` : 'Nessun esercizio risulta critico.',
      'Opzioni: dedicare una lezione di ripasso a quel topic prima dell\'appello, oppure ridurne il peso o la difficoltà (prova la modalità what-if).',
    ].join(' ');
  },

  async lessonSuggestions({ distributions }) {
    await sleep(800);
    return [...distributions]
      .sort((a, b) => b.pctGap - a.pctGap)
      .slice(0, 3)
      .filter((d) => d.pctGap > 0.05)
      .map((d) => ({
        topic: d.topicName,
        insight: `Il ${Math.round(d.pctGap * 100)}% della classe è in fascia rossa (media ${Math.round(d.avgScore)}/100).`,
        suggestion: d.topicName === 'Dualità' ? 'Il 61% sbaglia la domanda 4 del quiz (scarti complementari): riprendi il legame tra variabili duali positive e vincoli attivi.' : `Dedica 20 minuti a un esercizio svolto su ${d.topicName} all'inizio della prossima lezione.`,
        example: d.topicName === 'Dualità' ? 'Usa il problema della dieta: interpreta y₂ come "prezzo" della vitamina e mostra che se y₂ > 0 il vincolo è soddisfatto all\'uguaglianza.' : 'Parti da un esempio numerico piccolo, poi generalizza.',
      }));
  },

  async summarizeCluster({ title, questions }) {
    await sleep(500);
    return `${questions.length} domande su "${title}". Il dubbio ricorrente riguarda le regole operative più che la teoria.`;
  },

  async *roleplayReply({ scenario, history, message }) {
    await sleep(500);
    const m = message.toLowerCase();
    const facts = scenario.hidden_facts;
    let reply: string;
    if (/braccio|irradia|spost|dove/.test(m)) reply = `Adesso che me lo chiede… sì, ${facts[0].toLowerCase()}. Pensavo fosse un dolore muscolare.`;
    else if (/fum|sigarett/.test(m)) reply = `Eh, ${facts[1].toLowerCase()}. Lo so, lo so…`;
    else if (/famil|padre|madre|genitor/.test(m)) reply = `${facts[2]}. Non ci avevo pensato.`;
    else if (/sud|freddo|nausea/.test(m)) reply = `Sì, ${facts[3].toLowerCase()}, mi ero spaventato.`;
    else if (/farmac|pillol|terapia|medicin/.test(m)) reply = `${facts[4]}.`;
    else if (/camion|furgon|capacit/.test(m)) reply = facts[0];
    else if (/client|orari|mattin/.test(m)) reply = facts[1];
    else if (/autist|ore|turn/.test(m)) reply = facts[2];
    else if (/deposit|magazz/.test(m)) reply = facts[3];
    else reply = history.length < 2 ? 'Non so bene cosa dirle… mi chieda lei.' : 'Mah, non saprei. Cos\'altro le serve sapere?';
    yield* streamText(reply, 20);
  },

  async evaluateRoleplay({ scenario, history }) {
    await sleep(1200);
    const userText = history.filter((h) => h.role === 'user').map((h) => h.content.toLowerCase()).join(' ');
    const assistantText = history.filter((h) => h.role === 'assistant').map((h) => h.content.toLowerCase()).join(' ');
    const discovered = scenario.hidden_facts.filter((f) => assistantText.includes(f.toLowerCase().slice(0, 18)));
    const ratio = discovered.length / scenario.hidden_facts.length;
    const criteria = scenario.rubric.map((r, i) => {
      const s = Math.round(Math.min(100, 45 + ratio * 45 + (userText.length > 200 ? 8 : 0) - i * 3));
      return { criterion: r.criterion, score: s, comment: s >= 75 ? 'Ben gestito.' : s >= 55 ? 'Discreto, ma con domande poco mirate.' : 'Da migliorare: approccio poco strutturato.' };
    });
    const total = Math.round(criteria.reduce((s, c, i) => s + c.score * scenario.rubric[i].weight, 0));
    return {
      totalScore: total,
      criteria,
      factsDiscovered: discovered,
      factsMissed: scenario.hidden_facts.filter((f) => !discovered.includes(f)),
      feedback: ratio >= 0.6 ? 'Hai fatto emergere la maggior parte delle informazioni chiave con domande pertinenti.' : 'Hai lasciato inesplorate informazioni importanti: usa uno schema strutturato e fai domande aperte.',
    };
  },

  async extractCvSkills() {
    await sleep(1400);
    return [
      { name: 'Excel', level: 4 },
      { name: 'Python', level: 3 },
      { name: 'SQL', level: 4 },
      { name: 'Power BI', level: 2 },
      { name: 'Inglese B2', level: 4 },
    ];
  },
};

export const ai: AiClient = mockClient;
