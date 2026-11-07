import type { Mastery, Topic } from '@/types/database';
import { bandOf, type Band } from './mastery';
import { computeReadiness } from './readiness';
import { round } from './utils';

export interface TopicDistribution {
  topicId: string;
  topicName: string;
  examWeight: number;
  module: string | null;
  avgScore: number;
  counts: Record<Band, number>;
  pctGap: number;
}

/** Aggregati di classe per topic (il docente non vede mai il singolo studente). */
export function topicDistributions(topics: Topic[], mastery: Mastery[], studentIds: string[]): TopicDistribution[] {
  return topics.map((t) => {
    const counts: Record<Band, number> = { gap: 0, consolidating: 0, mastered: 0, unverified: 0 };
    let sum = 0;
    let n = 0;
    for (const sid of studentIds) {
      const m = mastery.find((x) => x.topic_id === t.id && x.student_id === sid);
      counts[m ? bandOf(m.score, m.confidence) : 'unverified']++;
      if (m) {
        sum += m.score;
        n++;
      }
    }
    return {
      topicId: t.id,
      topicName: t.name,
      examWeight: t.exam_weight,
      module: t.module,
      avgScore: n ? round(sum / n, 1) : 0,
      counts,
      pctGap: studentIds.length ? round(counts.gap / studentIds.length, 3) : 0,
    };
  });
}

export function readinessHistogram(readinessValues: number[]) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, from: i * 10, count: 0 }));
  for (const r of readinessValues) buckets[Math.min(9, Math.floor(r / 10))].count++;
  return buckets;
}

export function classReadiness(topics: Topic[], mastery: Mastery[], studentIds: string[]): number[] {
  return studentIds.map((sid) => computeReadiness(topics, mastery.filter((m) => m.student_id === sid)).readiness);
}
