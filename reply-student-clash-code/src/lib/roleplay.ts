/**
 * Simulatore di consulenza: etichette e calcolo del punteggio (funzioni pure).
 * I numeri li calcola il codice; l'LLM interpreta il personaggio e scrive il feedback testuale.
 */
import type { RoleplayAttitude, RoleplayDifficulty, RoleplayFact, RoleplayScenario, RubricCriterion } from '@/types/database';
import { clamp, round } from './utils';

export const DIFFICULTY_INFO: Record<RoleplayDifficulty, { label: string; description: string }> = {
  1: { label: 'Base', description: 'Caso semplice: il personaggio collabora, offre informazioni spontaneamente e vedi i suggerimenti.' },
  2: { label: 'Intermedia', description: 'Più informazioni nascoste: emergono solo con le domande giuste. Nessun suggerimento.' },
  3: { label: 'Avanzata', description: 'Caso completo con dettagli critici, risposte solo a domande precise e obiezioni da gestire.' },
};

/** Difficoltà del learning_event generato dalla simulazione. */
export const EVENT_DIFFICULTY: Record<RoleplayDifficulty, number> = { 1: 0.4, 2: 0.6, 3: 0.8 };

/** Difficoltà consigliata in base alla readiness attuale sulla materia. */
export const recommendedDifficulty = (readiness: number): RoleplayDifficulty => (readiness < 50 ? 1 : readiness < 70 ? 2 : 3);

export const ATTITUDE_INFO: Record<RoleplayAttitude, { label: string; description: string }> = {
  gentle: { label: 'Gentile', description: 'Disponibile e collaborativo.' },
  moderate: { label: 'Moderato', description: 'Pragmatico, un po’ impaziente.' },
  aggressive: { label: 'Aggressivo', description: 'Diffidente e polemico: va gestito con calma ed empatia.' },
};

export interface RoleplayTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Fatti presenti nello scenario al livello di difficoltà scelto. */
export const availableFacts = (scenario: RoleplayScenario, difficulty: RoleplayDifficulty): RoleplayFact[] =>
  scenario.hidden_facts.filter((f) => f.level <= difficulty);

const OPEN_STARTS = ['come', 'cosa', 'che cosa', 'perche', 'quando', 'dove', 'quale', 'quali', 'quanto', 'quanti', 'mi racconti', 'mi descriva', 'mi parli', 'mi spieghi', 'in che modo', 'puo descrivere', 'puo raccontarmi'];
const EMPATHY = ['capisco', 'comprendo', 'mi dispiace', 'tranquill', 'non si preoccupi', 'ha ragione', 'immagino', 'grazie', 'la ascolto', 'e normale'];

export const isEmpathetic = (msg: string) => EMPATHY.some((w) => normalize(msg).includes(w));

export interface RoleplayScore {
  total: number; // 0..100, include bonus difficoltà
  base: number; // senza bonus
  difficultyBonus: number;
  criteria: (RubricCriterion & { score: number })[];
  factsDiscovered: RoleplayFact[];
  factsMissed: RoleplayFact[];
  /** punteggio per i topic esercitati nel caso: diventa un learning_event (source 'simulation') */
  topicScores: { topicId: string; score: number; discovered: number; total: number }[];
  /** topic presenti nel caso ma mai toccati: nessun evento (non è un errore, è un'occasione persa) */
  topicsNotExercised: string[];
  stats: { messages: number; questions: number; openQuestions: number; empathy: number; solutionMentions: number };
}

export function scoreRoleplay(input: {
  scenario: RoleplayScenario;
  difficulty: RoleplayDifficulty;
  attitude: RoleplayAttitude;
  history: RoleplayTurn[];
  revealedFactIds: string[];
}): RoleplayScore {
  const { scenario, difficulty, attitude, history, revealedFactIds } = input;
  const user = history.filter((t) => t.role === 'user').map((t) => normalize(t.content.trim()));
  const facts = availableFacts(scenario, difficulty);
  const discovered = facts.filter((f) => revealedFactIds.includes(f.id));
  const ratio = facts.length ? discovered.length / facts.length : 0;

  const questions = user.filter((m) => m.includes('?') || OPEN_STARTS.some((w) => m.startsWith(w))).length;
  const openQuestions = user.filter((m) => OPEN_STARTS.some((w) => m.startsWith(w) || m.includes(` ${w} `))).length;
  const empathy = user.filter((m) => EMPATHY.some((w) => m.includes(w))).length;
  const allText = user.join(' ');
  const solutionMentions = scenario.solution_keywords.filter((k) => allText.includes(normalize(k))).length;

  const byFocus: Record<RubricCriterion['focus'], number> = user.length === 0
    ? { discovery: 0, communication: 0, relationship: 0, solution: 0 }
    : {
        discovery: 10 + 90 * ratio,
        communication: 30 + 40 * Math.min(1, openQuestions / Math.max(1, questions)) + Math.min(30, questions * 6),
        relationship: { gentle: 65, moderate: 55, aggressive: 35 }[attitude] + Math.min(45, empathy * 15),
        solution: 15 + Math.min(60, solutionMentions * 20) + 25 * ratio,
      };

  const criteria = scenario.rubric.map((r) => ({ ...r, score: round(clamp(byFocus[r.focus], 0, 100), 0) }));
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const base = round(criteria.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight, 0);
  const difficultyBonus = (difficulty - 1) * 4 + (attitude === 'aggressive' ? 3 : 0);
  // Per ogni topic presente nel caso: quante sue informazioni sono emerse + capacità di proporre una soluzione
  const topicIds = [...new Set(facts.map((f) => f.topic_id))];
  // Una simulazione dimostra di saper applicare il topic, non la padronanza completa: tetto a 90.
  const perTopic = topicIds.map((topicId) => {
    const tf = facts.filter((f) => f.topic_id === topicId);
    const d = tf.filter((f) => revealedFactIds.includes(f.id)).length;
    return { topicId, discovered: d, total: tf.length, score: round(clamp(40 + 45 * (d / tf.length) + Math.min(15, solutionMentions * 5), 0, 90), 0) };
  });
  const topicScores = user.length === 0 ? [] : perTopic.filter((t) => t.discovered > 0);
  const topicsNotExercised = perTopic.filter((t) => t.discovered === 0).map((t) => t.topicId);

  return {
    topicScores,
    topicsNotExercised,
    total: round(clamp(base + (user.length ? difficultyBonus : 0), 0, 100), 0),
    base,
    difficultyBonus,
    criteria,
    factsDiscovered: discovered,
    factsMissed: facts.filter((f) => !revealedFactIds.includes(f.id)),
    stats: { messages: user.length, questions, openQuestions, empathy, solutionMentions },
  };
}
