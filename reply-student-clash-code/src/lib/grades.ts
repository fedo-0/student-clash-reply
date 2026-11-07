import type { ExamRecord } from '@/types/database';
import { round } from './utils';

/** Voto valido per la media (lode = 30; idoneità esclusa). */
const gradeValue = (r: Pick<ExamRecord, 'grade'>) => r.grade ?? 0;
const isGraded = (r: Pick<ExamRecord, 'grade' | 'passed_at'>) => r.passed_at != null && r.grade != null;

export function weightedAverage(records: Pick<ExamRecord, 'grade' | 'cfu' | 'passed_at'>[]): number {
  const g = records.filter(isGraded);
  const cfu = g.reduce((s, r) => s + r.cfu, 0);
  return cfu ? round(g.reduce((s, r) => s + gradeValue(r) * r.cfu, 0) / cfu, 2) : 0;
}

export function arithmeticAverage(records: Pick<ExamRecord, 'grade' | 'passed_at'>[]): number {
  const g = records.filter(isGraded);
  return g.length ? round(g.reduce((s, r) => s + gradeValue(r), 0) / g.length, 2) : 0;
}

/** Voto di laurea di partenza = media ponderata * 110 / 30. */
export const graduationBase = (weightedAvg: number) => round((weightedAvg * 110) / 30, 1);

export function earnedCfu(records: Pick<ExamRecord, 'cfu' | 'passed_at'>[]): number {
  return records.filter((r) => r.passed_at).reduce((s, r) => s + r.cfu, 0);
}

export interface GradeSimulation {
  currentAverage: number;
  projectedAverage: number;
  projectedGraduationBase: number;
  /** Voto medio necessario sugli esami mancanti per raggiungere l'obiettivo (null se nessun esame mancante). */
  requiredAverage: number | null;
  /** true se l'obiettivo è raggiungibile (voto richiesto ≤ 30). */
  feasible: boolean;
  remainingCfu: number;
}

/**
 * Simulatore del libretto: applica voti ipotetici agli esami non sostenuti
 * e calcola il voto medio necessario per raggiungere la media obiettivo.
 */
export function simulateGrades(
  records: ExamRecord[],
  hypothetical: Record<string, number>,
  targetAverage: number,
): GradeSimulation {
  const done = records.filter(isGraded);
  const pending = records.filter((r) => !r.passed_at && r.grade == null);
  const doneCfu = done.reduce((s, r) => s + r.cfu, 0);
  const doneSum = done.reduce((s, r) => s + gradeValue(r) * r.cfu, 0);
  const remainingCfu = pending.reduce((s, r) => s + r.cfu, 0);

  const withHyp = pending.filter((r) => hypothetical[r.id] != null);
  const hypCfu = withHyp.reduce((s, r) => s + r.cfu, 0);
  const hypSum = withHyp.reduce((s, r) => s + hypothetical[r.id] * r.cfu, 0);
  const projectedAverage = doneCfu + hypCfu ? round((doneSum + hypSum) / (doneCfu + hypCfu), 2) : 0;

  const required = remainingCfu ? (targetAverage * (doneCfu + remainingCfu) - doneSum) / remainingCfu : null;
  return {
    currentAverage: weightedAverage(records),
    projectedAverage,
    projectedGraduationBase: graduationBase(projectedAverage),
    requiredAverage: required == null ? null : round(required, 2),
    feasible: required == null ? weightedAverage(records) >= targetAverage : required <= 30,
    remainingCfu,
  };
}
