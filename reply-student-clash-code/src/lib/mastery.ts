import { BANDS } from '@/config/app';
import type { LearningEvent, Mastery } from '@/types/database';
import { clamp, round } from './utils';

export type Band = 'gap' | 'consolidating' | 'mastered' | 'unverified';

export const BAND_LABEL: Record<Band, string> = {
  gap: 'Lacuna',
  consolidating: 'In consolidamento',
  mastered: 'Padroneggiato',
  unverified: 'Da verificare',
};

export interface MasteryState {
  score: number;
  confidence: number;
  events_count: number;
}

/** k decresce con il numero di eventi già visti (min 0.15): i primi eventi pesano di più. */
export function learningRate(eventsSeen: number): number {
  return Math.max(0.15, 1 / (eventsSeen + 1));
}

export function confidenceFor(eventsCount: number): number {
  return round(1 - Math.exp(-eventsCount / 4), 3);
}

/**
 * Aggiornamento EMA: new = old + k * weight * (score - old).
 * Stessa formula del trigger SQL apply_learning_event().
 */
export function applyEvent(prev: MasteryState | null, ev: Pick<LearningEvent, 'score' | 'weight'>): MasteryState {
  if (!prev || prev.events_count === 0) {
    return { score: round(clamp(ev.score, 0, 100), 2), confidence: confidenceFor(1), events_count: 1 };
  }
  const k = learningRate(prev.events_count);
  const next = prev.score + k * ev.weight * (ev.score - prev.score);
  const n = prev.events_count + 1;
  return { score: round(clamp(next, 0, 100), 2), confidence: confidenceFor(n), events_count: n };
}

/** Ricalcola il mastery per topic riproducendo gli eventi in ordine cronologico. */
export function replayEvents(events: Pick<LearningEvent, 'topic_id' | 'score' | 'weight' | 'created_at'>[]) {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const byTopic = new Map<string, MasteryState>();
  for (const ev of sorted) byTopic.set(ev.topic_id, applyEvent(byTopic.get(ev.topic_id) ?? null, ev));
  return byTopic;
}

export function bandOf(score: number, confidence: number): Band {
  if (confidence < BANDS.minConfidence) return 'unverified';
  if (score < BANDS.gapMax) return 'gap';
  if (score < BANDS.consolidatingMax) return 'consolidating';
  return 'mastered';
}

export function bandOfMastery(m: Pick<Mastery, 'score' | 'confidence'> | undefined | null): Band {
  return m ? bandOf(m.score, m.confidence) : 'unverified';
}
