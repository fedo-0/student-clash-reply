/**
 * Interfaccia AI UNICA. Oggi: risposte mock credibili (ritardo simulato + streaming finto).
 * Domani: ogni metodo chiamerà una Supabase Edge Function (es. supabase.functions.invoke('ai-chat'))
 * che parla con il provider LLM scelto. NESSUNA chiave API nel frontend.
 *
 * Regola: i numeri (mastery, readiness, Monte Carlo, ...) li calcola src/lib; l'LLM scrive solo testo.
 */
import type { ChatMode, Citation, QuestionType, RoleplayAttitude, RoleplayDifficulty, RoleplayScenario, Topic } from '@/types/database';
import { availableFacts, isEmpathetic, normalize, type RoleplayScore } from '@/lib/roleplay';
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
  action: 'tutor' | 'quiz' | 'simulation' | 'review';
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

export type RoleplayChunk = { type: 'token'; value: string } | { type: 'fact'; id: string };

export interface RoleplayRequest {
  scenario: RoleplayScenario;
  difficulty: RoleplayDifficulty;
  attitude: RoleplayAttitude;
  history: ChatTurn[];
  message: string;
  /** id dei fatti già emersi */
  revealed: string[];
}

/** Il report testuale scritto dall'AI (i punteggi li calcola src/lib/roleplay.ts). */
export interface RoleplayReport {
  feedback: string;
  strengths: string[];
  improvements: string[];
  missedQuestions: string[];
  nextStep: string;
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
  /** Il personaggio risponde: stream di testo + eventi 'fact' quando emerge un'informazione nascosta. */
  roleplayReply(req: RoleplayRequest): AsyncGenerator<RoleplayChunk>;
  evaluateRoleplay(req: { scenario: RoleplayScenario; difficulty: RoleplayDifficulty; attitude: RoleplayAttitude; score: RoleplayScore; topicNames: Record<string, string> }): Promise<RoleplayReport>;
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
      if (recs.length >= 2) break;
    }
    const next = sorted[0];
    if (next) recs.push({ id: 'simulation', title: `Simula un caso di ${next.name}`, reason: `Un cliente interpretato dall'AI ti porta un problema reale: applichi gli argomenti dell'esame e il risultato aggiorna la tua readiness.`, minutes: 15, action: 'simulation', link: `/student/roleplay?course=${next.id}` });
    return [...recs.slice(0, 2), ...recs.filter((r) => r.action === 'simulation')].slice(0, 3);
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

  async *roleplayReply({ scenario, difficulty, attitude, history, message, revealed }) {
    await sleep(450);
    const msg = normalize(message);
    const turn = history.filter((h) => h.role === 'user').length + 1;
    const pool = availableFacts(scenario, difficulty).filter((f) => !revealed.includes(f.id));
    // a difficoltà avanzata le domande vaghe non bastano
    const precise = difficulty < 3 || message.trim().length >= 20;
    const maxPerTurn = difficulty === 1 ? 3 : difficulty === 2 ? 2 : 1;
    let matched = precise ? pool.filter((f) => f.keywords.some((k) => msg.includes(normalize(k)))).slice(0, maxPerTurn) : [];

    // l'empatia calma un personaggio aggressivo
    const calmedBefore = attitude === 'aggressive' && history.some((h) => h.role === 'user' && isEmpathetic(h.content));
    const calmed = attitude === 'aggressive' && !calmedBefore && isEmpathetic(message);
    const tone: RoleplayAttitude = calmed || calmedBefore ? 'moderate' : attitude;
    const proposesSolution = scenario.solution_keywords.some((k) => msg.includes(normalize(k)));
    const pickOf = (arr: string[]) => arr[turn % arr.length];
    const PREFIX: Record<RoleplayAttitude, string[]> = {
      gentle: ['Certo, volentieri.', 'Ottima domanda.', 'Sì, gliene parlo subito.'],
      moderate: ['Allora…', 'Mah, sì.', 'Dunque.'],
      aggressive: ["Gliel'ho già detto, comunque:", 'Ma è proprio necessario? Va bene:', 'Il tempo è denaro, quindi in breve:'],
    };
    const DEFLECT: Record<RoleplayAttitude, string[]> = {
      gentle: ['Non saprei bene cosa dirle… mi faccia lei le domande che servono.', 'Mi scusi, non ho capito bene: cosa le serve sapere esattamente?'],
      moderate: ['Non capisco dove vuole arrivare. Cosa le serve di preciso?', 'Mah, non saprei. Mi chieda qualcosa di più concreto.'],
      aggressive: ['Mi sta facendo perdere tempo. Faccia domande precise!', 'Non sono qui per la teoria, voglio risposte.', 'Ma lei ha già fatto questo lavoro?'],
    };
    const parts: string[] = [];
    if (calmed) parts.push('Va bene… mi scusi, sono un po’ nervoso. Mi chieda pure.');

    if (matched.length) {
      parts.push(`${pickOf(PREFIX[tone])} ${matched.map((f) => f.reply).join(' ')}`);
    } else if (difficulty === 1 && pool.length && turn % 2 === 0) {
      matched = [pool[0]];
      parts.push(`Ah, forse è utile dirle anche questo: ${pool[0].reply}`);
    } else if (!calmed && !proposesSolution) {
      parts.push(pickOf(DEFLECT[tone]));
    }

    if (proposesSolution) {
      parts.push({ gentle: 'Interessante! Mi spiega meglio come funzionerebbe?', moderate: 'Ok, ma in pratica cosa cambia per me?', aggressive: 'Belle parole. Mi faccia vedere i risultati concreti.' }[tone]);
    }
    if (difficulty === 3 && turn >= 2 && turn % 3 === 2 && scenario.objections.length) {
      parts.push(scenario.objections[Math.floor(turn / 3) % scenario.objections.length]);
    }

    for (const f of matched) yield { type: 'fact', id: f.id };
    for await (const t of streamText(parts.join(' '), 18)) yield { type: 'token', value: t };
  },

  async evaluateRoleplay({ scenario, difficulty, attitude, score, topicNames }) {
    await sleep(1100);
    const sorted = [...score.criteria].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const ratio = score.factsDiscovered.length / Math.max(1, score.factsDiscovered.length + score.factsMissed.length);
    const who = scenario.counterpart_label.toLowerCase();
    const topics = [...score.topicScores].sort((a, b) => b.score - a.score);
    const bestTopic = topics[0];
    const worstTopic = topics[topics.length - 1];
    const strengths = [
      bestTopic && bestTopic.score >= 70 ? `Su ${topicNames[bestTopic.topicId]} hai fatto le domande giuste: sai riconoscerlo in un caso reale.` : null,
      best && best.score >= 60 ? `${best.criterion}: ${best.description.toLowerCase()}` : null,
      ratio >= 0.6 ? `Hai fatto emergere ${score.factsDiscovered.length} informazioni chiave su ${score.factsDiscovered.length + score.factsMissed.length}.` : null,
      score.stats.empathy > 0 ? 'Hai mostrato attenzione ed empatia verso il tuo interlocutore.' : null,
    ].filter(Boolean) as string[];
    const improvements = [
      worstTopic && worstTopic.score < 60 && worstTopic !== bestTopic ? `${topicNames[worstTopic.topicId]}: nel caso non l'hai riconosciuto. È lo stesso argomento che ti servirà all'esame.` : null,
      worst && worst.score < 70 ? `${worst.criterion}: ${worst.description.toLowerCase()}` : null,
      score.stats.openQuestions < score.stats.questions / 2 ? 'Usa più domande aperte ("Come…", "Mi racconti…") prima di quelle chiuse.' : null,
      score.stats.solutionMentions === 0 ? `Chiudi sempre con una proposta concreta e i prossimi passi per il ${who}.` : null,
      attitude === 'aggressive' && score.stats.empathy === 0 ? 'Con un interlocutore aggressivo riconosci prima la sua frustrazione ("Capisco che…"): si calma e collabora di più.' : null,
    ].filter(Boolean) as string[];
    const nextStep = score.total >= 75 && difficulty < 3
      ? `Ottimo risultato: prova il livello ${difficulty === 1 ? 'Intermedio' : 'Avanzato'}.`
      : score.total >= 75
        ? `Hai superato il livello più difficile${attitude === 'aggressive' ? ' con un ' + who + ' aggressivo' : ''}: ora punta a far emergere tutte le informazioni del caso.`
        : attitude !== 'aggressive' && score.total >= 60
        ? `Riprova con un ${who} aggressivo per allenare la gestione della relazione.`
        : 'Ripeti lo stesso scenario usando i suggerimenti qui sotto: vedrai emergere più informazioni.';
    return {
      feedback: score.total >= 75
        ? `Consulenza riuscita. Hai condotto il colloquio in modo strutturato e hai raccolto quasi tutto ciò che serviva per lavorare sul caso.`
        : score.total >= 50
          ? `Buona base, ma alcune informazioni importanti sono rimaste nascoste: con domande più mirate avresti avuto un quadro completo del caso.`
          : `Il colloquio è rimasto in superficie: prima di proporre soluzioni, dedica più tempo a capire la situazione del ${who}.`,
      strengths: strengths.length ? strengths : ['Hai avviato il colloquio: è il primo passo.'],
      improvements,
      missedQuestions: score.factsMissed.map((f) => f.hint),
      nextStep,
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
