/**
 * Corrispondenza esame ↔ profilo dello studente (funzione pura).
 * È l'equivalente del "match" di un annuncio di lavoro: i requisiti li pubblica il docente,
 * le evidenze arrivano da mastery (attività sulla piattaforma), CV, progetti e libretto.
 * I numeri li calcola questo modulo; l'LLM scrive solo l'elaborato testuale.
 *
 * Score complessivo = 0.6·competenze + 0.25·skill/strumenti + 0.15·propedeuticità
 * (stessi pesi dell'affinità; se una categoria manca i pesi vengono rinormalizzati).
 */
import type {
  Course, ExamMatchItem, ExamMatchStatus, ExamPosting, ExamRecord, ExamRequirement, Mastery, StudentProject, StudentSkill, Topic,
} from '@/types/database';
import { BANDS } from '@/config/app';
import { normalize } from './roleplay';
import { clamp, round } from './utils';

export const MATCH_WEIGHTS = { competences: 0.6, skills: 0.25, prerequisites: 0.15 };

/** Punteggio assegnato a una competenza che lo studente non ha ancora mai esercitato: la costruirà nel corso. */
export const NEW_COMPETENCE_SCORE = 40;

export const STATUS_LABEL: Record<ExamMatchStatus, string> = {
  met: 'Soddisfatto',
  partial: 'Parziale',
  gap: 'Da colmare',
  unverified: 'Da verificare',
  new: 'Da costruire',
};

export interface ExamMatchInput {
  posting: ExamPosting;
  mastery: Mastery[]; // tutte le mastery dello studente
  topics: Topic[];
  courses: Course[];
  skills: StudentSkill[];
  projects: StudentProject[];
  records: ExamRecord[];
}

export interface ExamMatchResultItem extends ExamMatchItem {
  requirement: ExamRequirement;
}

export interface ExamMatchResult {
  score: number;
  label: string;
  components: { competences: number | null; skills: number | null; prerequisites: number | null };
  items: ExamMatchResultItem[];
  counts: Record<ExamMatchStatus, number>;
}

const statusFromScore = (s: number): ExamMatchStatus => (s >= BANDS.consolidatingMax ? 'met' : s >= BANDS.gapMax ? 'partial' : 'gap');
const sameName = (a: string, b: string) => normalize(a) === normalize(b) || normalize(a).includes(normalize(b)) || normalize(b).includes(normalize(a));

function evalCompetence(r: ExamRequirement, input: ExamMatchInput): ExamMatchItem {
  const ids = r.topic_ids ?? [];
  const found = ids.map((id) => input.mastery.find((m) => m.topic_id === id)).filter((m): m is Mastery => !!m && m.events_count > 0);
  if (!found.length) {
    return {
      requirement_id: r.id, score: NEW_COMPETENCE_SCORE, status: 'new',
      evidence: ids.length ? ['Argomenti collegati non ancora praticati sulla piattaforma'] : ['Argomento nuovo: verrà trattato nel corso'],
    };
  }
  const score = found.reduce((s, m) => s + m.score, 0) / found.length;
  const confidence = found.reduce((s, m) => s + m.confidence, 0) / found.length;
  const evidence = found.map((m) => {
    const t = input.topics.find((x) => x.id === m.topic_id);
    const c = input.courses.find((x) => x.id === t?.course_id);
    return `Livello ${Math.round(m.score)}/100 su ${t?.name ?? 'argomento'}${c ? ` (${c.name})` : ''}`;
  });
  return { requirement_id: r.id, score: round(score, 0), status: confidence < BANDS.minConfidence ? 'unverified' : statusFromScore(score), evidence };
}

function evalSkill(r: ExamRequirement, input: ExamMatchInput): ExamMatchItem {
  const skill = input.skills.find((s) => sameName(s.name, r.label));
  const projects = input.projects.filter((p) => p.skills.some((s) => sameName(s, r.label)));
  const evidence: string[] = [];
  let score = 0;
  if (skill) {
    score = (skill.level ?? 3) * 20;
    const src = skill.source === 'cv_ai' ? 'CV' : skill.source === 'project' ? 'Progetti' : 'Profilo';
    evidence.push(`${src}: ${skill.name} livello ${skill.level ?? '?'}/5`);
  }
  for (const p of projects) evidence.push(`Progetto: ${p.title}`);
  if (projects.length) score = Math.max(score, 50) + 10;
  if (!evidence.length) {
    return { requirement_id: r.id, score: 0, status: 'gap', evidence: ['Non presente nel profilo, nel CV o nei progetti'] };
  }
  score = clamp(score, 0, 100);
  return { requirement_id: r.id, score, status: score >= 60 ? 'met' : 'partial', evidence };
}

function evalPrerequisite(r: ExamRequirement, input: ExamMatchInput): ExamMatchItem {
  const rec = input.records.find((x) => sameName(x.course_name, r.exam_name ?? r.label));
  if (rec?.passed_at) {
    if (rec.grade == null) return { requirement_id: r.id, score: 80, status: 'met', evidence: [`Libretto: ${rec.course_name} superato (idoneità)`] };
    const score = round(60 + ((rec.grade - 18) / 12) * 40 + (rec.honors ? 5 : 0), 0);
    return { requirement_id: r.id, score: Math.min(100, score), status: 'met', evidence: [`Libretto: ${rec.course_name} ${rec.grade}${rec.honors ? ' e lode' : ''}/30`] };
  }
  return { requirement_id: r.id, score: 20, status: 'gap', evidence: [rec ? `Libretto: ${rec.course_name} non ancora sostenuto` : 'Esame non presente nel libretto'] };
}

export function computeExamMatch(input: ExamMatchInput): ExamMatchResult {
  const items: ExamMatchResultItem[] = input.posting.requirements.map((r) => {
    const it = r.kind === 'competence' ? evalCompetence(r, input) : r.kind === 'prerequisite' ? evalPrerequisite(r, input) : evalSkill(r, input);
    return { ...it, requirement: r };
  });

  const avg = (list: ExamMatchResultItem[]) => {
    const w = list.reduce((s, i) => s + i.requirement.weight, 0);
    return w ? list.reduce((s, i) => s + i.score * i.requirement.weight, 0) / w : null;
  };
  const competences = avg(items.filter((i) => i.requirement.kind === 'competence'));
  const skills = avg(items.filter((i) => i.requirement.kind === 'skill' || i.requirement.kind === 'tool'));
  const prerequisites = avg(items.filter((i) => i.requirement.kind === 'prerequisite'));

  const parts = ([['competences', competences], ['skills', skills], ['prerequisites', prerequisites]] as const).filter(([, v]) => v != null);
  const wSum = parts.reduce((s, [k]) => s + MATCH_WEIGHTS[k], 0) || 1;
  const score = round(parts.reduce((s, [k, v]) => s + MATCH_WEIGHTS[k] * (v as number), 0) / wSum, 0);

  const counts: Record<ExamMatchStatus, number> = { met: 0, partial: 0, gap: 0, unverified: 0, new: 0 };
  for (const i of items) counts[i.status]++;

  return {
    score,
    label: score >= 75 ? 'Ottima corrispondenza' : score >= 60 ? 'Buona corrispondenza' : score >= 45 ? 'Corrispondenza parziale' : 'Corrispondenza bassa',
    components: {
      competences: competences == null ? null : round(competences, 0),
      skills: skills == null ? null : round(skills, 0),
      prerequisites: prerequisites == null ? null : round(prerequisites, 0),
    },
    items,
    counts,
  };
}
