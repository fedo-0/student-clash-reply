import type { ExamExercise } from '@/types/database';
import { createRng } from './random';
import { round } from './utils';

/**
 * Probabilità di risolvere un esercizio: logistica su (mastery - difficoltà).
 * mastery 0..100 (media dei topic dell'esercizio), difficulty 0..1.
 * Con mastery/100 == difficulty → p ≈ 0.6 (bias leggermente positivo).
 */
export function successProbability(mastery: number, difficulty: number, slope = 7, bias = 0.4): number {
  return 1 / (1 + Math.exp(-(slope * (mastery / 100 - difficulty) + bias)));
}

export interface StudentMasteryVector {
  studentKey: string; // anonimo
  mastery: Record<string, number>; // topic_id → score
}

export interface PredictionInput {
  exercises: ExamExercise[];
  students: StudentMasteryVector[];
  maxPoints: number; // es. 30
  passThreshold: number; // es. 18
  iterations?: number;
  seed?: number;
  /** what-if: moltiplicatore dei punti per esercizio (id → fattore). */
  pointOverrides?: Record<string, number>;
}

export interface PredictionResult {
  expectedMean: number;
  ciLow: number; // 5° percentile della media di classe
  ciHigh: number; // 95° percentile
  passRate: number; // 0..1
  perExercise: { exerciseId: string; title: string; points: number; successRate: number; critical: boolean }[];
  histogram: { bucket: string; count: number }[]; // distribuzione voti attesi individuali
  studentsCount: number;
}

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];

/** Simulazione Monte Carlo del voto: i numeri li calcola il codice, l'LLM spiega soltanto. */
export function predictExam(input: PredictionInput): PredictionResult {
  const { students, maxPoints, passThreshold, iterations = 2000, seed = 42, pointOverrides = {} } = input;
  const exercises = input.exercises.map((e) => ({ ...e, points: e.points * (pointOverrides[e.id] ?? 1) }));
  const totalPoints = exercises.reduce((s, e) => s + e.points, 0) || 1;
  const rng = createRng(seed);

  // Probabilità per studente × esercizio
  const probs = students.map((s) =>
    exercises.map((e) => {
      const ms = e.topic_ids.map((t) => s.mastery[t] ?? 0);
      const m = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0;
      return successProbability(m, e.difficulty);
    }),
  );

  const classMeans: number[] = [];
  let passCount = 0;
  const successCount = exercises.map(() => 0);
  const buckets = new Map<string, number>();
  const bucketOf = (g: number) => (g < 18 ? '<18' : g >= 30 ? '30' : `${Math.floor(g / 2) * 2}-${Math.floor(g / 2) * 2 + 1}`);

  for (let it = 0; it < iterations; it++) {
    let sum = 0;
    for (let si = 0; si < students.length; si++) {
      let pts = 0;
      for (let ei = 0; ei < exercises.length; ei++) {
        // credito parziale: successo pieno con prob p, altrimenti 0-40% dei punti
        if (rng() < probs[si][ei]) {
          pts += exercises[ei].points;
          successCount[ei]++;
        } else {
          pts += exercises[ei].points * rng() * 0.4;
        }
      }
      const grade = (pts / totalPoints) * maxPoints;
      sum += grade;
      if (grade >= passThreshold) passCount++;
      if (it % 10 === 0) buckets.set(bucketOf(grade), (buckets.get(bucketOf(grade)) ?? 0) + 1);
    }
    classMeans.push(sum / Math.max(1, students.length));
  }

  classMeans.sort((a, b) => a - b);
  const n = iterations * Math.max(1, students.length);
  const perExercise = exercises.map((e, i) => ({
    exerciseId: e.id,
    title: e.title,
    points: round(e.points, 1),
    successRate: round(successCount[i] / n, 3),
    critical: successCount[i] / n < 0.5,
  }));
  const order = ['<18', '18-19', '20-21', '22-23', '24-25', '26-27', '28-29', '30'];
  const sampled = Math.ceil(iterations / 10);
  return {
    expectedMean: round(classMeans.reduce((a, b) => a + b, 0) / classMeans.length, 1),
    ciLow: round(percentile(classMeans, 0.05), 1),
    ciHigh: round(percentile(classMeans, 0.95), 1),
    passRate: round(passCount / n, 3),
    perExercise,
    histogram: order.map((bucket) => ({ bucket, count: round((buckets.get(bucket) ?? 0) / sampled, 1) })),
    studentsCount: students.length,
  };
}
