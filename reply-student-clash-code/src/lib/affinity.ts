import type { Course, ExamRecord, Mastery, StudentSkill, Topic, TopicPrerequisite } from '@/types/database';
import { computeReadiness } from './readiness';
import { BANDS } from '@/config/app';
import { round } from './utils';

export type AffinityItemKind = 'pro' | 'warn' | 'con';

export interface AffinityItem {
  kind: AffinityItemKind;
  text: string;
  topicId?: string;
}

export interface AffinityResult {
  score: number; // 0..100
  components: { readiness: number; prerequisites: number; skills: number };
  weights: { readiness: number; prerequisites: number; skills: number };
  items: AffinityItem[];
}

export interface AffinityInput {
  course: Course;
  topics: Topic[];
  mastery: Mastery[];
  topicPrerequisites: TopicPrerequisite[];
  /** Corsi propedeutici (id) e relativi record del libretto dello studente. */
  prerequisiteCourses: { course: Course; record: ExamRecord | undefined }[];
  studentSkills: StudentSkill[];
  /** Skill utili per il corso (dalla descrizione del corso / AI). */
  relevantSkills: string[];
}

const WEIGHTS = { readiness: 0.6, prerequisites: 0.25, skills: 0.15 };

/** Voto 18..30 → 0..100 (lode = 100). */
const gradeToScore = (r: ExamRecord) => (r.honors ? 100 : ((r.grade ?? 18) - 18) / 12 * 100);

/**
 * Affinità "alla LinkedIn": readiness + voti nei propedeutici + skill del profilo,
 * sempre accompagnata da una spiegazione leggibile.
 */
export function computeAffinity(input: AffinityInput): AffinityResult {
  const { topics, mastery, topicPrerequisites, prerequisiteCourses, studentSkills, relevantSkills } = input;
  const r = computeReadiness(topics, mastery);
  const items: AffinityItem[] = [];

  // --- Propedeutici
  const passed = prerequisiteCourses.filter((p) => p.record?.passed_at);
  const prereqScore = prerequisiteCourses.length
    ? passed.reduce((s, p) => s + gradeToScore(p.record!), 0) / prerequisiteCourses.length
    : 70;
  for (const p of prerequisiteCourses) {
    if (p.record?.passed_at && p.record.grade) {
      const g = p.record.honors ? '30 e lode' : `${p.record.grade}`;
      items.push(
        p.record.grade >= 25 || p.record.honors
          ? { kind: 'pro', text: `Hai superato ${p.course.name} con ${g}: buona base di partenza.` }
          : { kind: 'warn', text: `${p.course.name} superato con ${g}: ripassa le basi che servono qui.` },
      );
    } else {
      items.push({ kind: 'con', text: `Non hai ancora superato il propedeutico ${p.course.name}.` });
    }
  }

  // --- Skill del profilo
  const owned = new Set(studentSkills.map((s) => s.name.toLowerCase()));
  const matched = relevantSkills.filter((s) => owned.has(s.toLowerCase()));
  const skillScore = relevantSkills.length ? (matched.length / relevantSkills.length) * 100 : 50;
  if (matched.length) items.push({ kind: 'pro', text: `Dal tuo profilo: ${matched.join(', ')} ti aiuteranno in questo esame.` });

  // --- Topic
  const byTopic = new Map(r.items.map((i) => [i.topic.id, i]));
  for (const it of [...r.items].sort((a, b) => b.weight - a.weight)) {
    if (!it.practiced) {
      items.push({ kind: 'warn', text: `${it.topic.name} non è ancora stato praticato (${Math.round(it.weight * 100)}% dell'esame).`, topicId: it.topic.id });
    } else if (it.band === 'mastered') {
      items.push({ kind: 'pro', text: `${it.topic.name} padroneggiato (${Math.round(it.score)}/100).`, topicId: it.topic.id });
    } else if (it.band === 'gap') {
      // È una lacuna su un prerequisito di altri topic?
      const dependents = topicPrerequisites
        .filter((tp) => tp.prerequisite_topic_id === it.topic.id)
        .map((tp) => byTopic.get(tp.topic_id)?.topic.name)
        .filter(Boolean);
      items.push({
        kind: 'con',
        text: dependents.length
          ? `Lacuna su ${it.topic.name} (${Math.round(it.score)}/100), prerequisito di ${dependents.join(', ')}.`
          : `Lacuna su ${it.topic.name} (${Math.round(it.score)}/100), vale il ${Math.round(it.weight * 100)}% dell'esame.`,
        topicId: it.topic.id,
      });
    } else if (it.band === 'unverified') {
      items.push({ kind: 'warn', text: `${it.topic.name}: pochi dati, fai un quiz per verificarlo.`, topicId: it.topic.id });
    }
  }

  // Lacune su prerequisiti dei topic praticati
  for (const tp of topicPrerequisites) {
    const pre = byTopic.get(tp.prerequisite_topic_id);
    const dep = byTopic.get(tp.topic_id);
    if (pre && dep && pre.practiced && pre.score < BANDS.consolidatingMax && pre.band !== 'gap' && dep.band === 'gap') {
      items.push({ kind: 'con', text: `${dep.topic.name} è in difficoltà anche perché ${pre.topic.name} non è ancora solido.`, topicId: pre.topic.id });
    }
  }

  const score = WEIGHTS.readiness * r.readiness + WEIGHTS.prerequisites * prereqScore + WEIGHTS.skills * skillScore;
  const order: Record<AffinityItemKind, number> = { pro: 0, warn: 1, con: 2 };
  items.sort((a, b) => order[a.kind] - order[b.kind]);
  return {
    score: round(score, 0),
    components: { readiness: r.readiness, prerequisites: round(prereqScore, 0), skills: round(skillScore, 0) },
    weights: WEIGHTS,
    items,
  };
}
