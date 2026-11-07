import type { Mastery, Topic } from '@/types/database';
import { bandOfMastery, type Band } from './mastery';
import { round } from './utils';

export interface ReadinessItem {
  topic: Topic;
  score: number; // 0 se non praticato
  confidence: number;
  practiced: boolean;
  weight: number; // exam_weight normalizzato
  contribution: number; // punti di readiness portati
  missing: number; // punti di readiness ancora recuperabili
  band: Band;
}

export interface ReadinessResult {
  readiness: number; // 0..100
  confidence: number; // media pesata delle confidence
  items: ReadinessItem[];
}

/** Readiness = media dei mastery del corso pesata per exam_weight. Topic non praticati contano 0. */
export function computeReadiness(topics: Topic[], mastery: Mastery[]): ReadinessResult {
  const byTopic = new Map(mastery.map((m) => [m.topic_id, m]));
  const totalWeight = topics.reduce((s, t) => s + t.exam_weight, 0) || 1;
  let readiness = 0;
  let confidence = 0;
  const items = topics.map<ReadinessItem>((topic) => {
    const m = byTopic.get(topic.id);
    const weight = topic.exam_weight / totalWeight;
    const score = m?.score ?? 0;
    const conf = m?.confidence ?? 0;
    readiness += weight * score;
    confidence += weight * conf;
    return {
      topic,
      score,
      confidence: conf,
      practiced: !!m && m.events_count > 0,
      weight,
      contribution: weight * score,
      missing: weight * (100 - score),
      band: bandOfMastery(m),
    };
  });
  return { readiness: round(readiness, 1), confidence: round(confidence, 2), items };
}

/** Trend = differenza tra l'ultimo valore e quello di `weeksBack` settimane prima. */
export function trendOf(series: { value: number }[], weeksBack = 2): number {
  if (series.length < 2) return 0;
  const last = series[series.length - 1].value;
  const prev = series[Math.max(0, series.length - 1 - weeksBack)].value;
  return round(last - prev, 1);
}
