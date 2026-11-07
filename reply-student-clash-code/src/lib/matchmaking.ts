import { round } from './utils';

export interface PoolStudent {
  id: string;
  name: string;
  mastery: Record<string, number>; // topic_id → 0..100
  availability: string[];
}

export interface MatchedGroup {
  members: { id: string; name: string; roleTopicId: string | null }[];
  coverage: Record<string, number>; // topic → max mastery nel gruppo
  coverageScore: number; // media della copertura
  sharedSlots: string[];
}

const groupCoverage = (members: PoolStudent[], topics: string[]) =>
  Object.fromEntries(topics.map((t) => [t, Math.max(0, ...members.map((m) => m.mastery[t] ?? 0))]));

const coverageScore = (cov: Record<string, number>, topics: string[]) =>
  topics.reduce((s, t) => s + cov[t], 0) / Math.max(1, topics.length);

const sharedSlots = (members: PoolStudent[]) =>
  members.reduce<string[]>((acc, m, i) => (i === 0 ? [...m.availability] : acc.filter((s) => m.availability.includes(s))), []);

/**
 * Matchmaking greedy per complementarità:
 * 1. numero gruppi G = ceil(n / targetSize); i G studenti con profilo più "forte e sbilanciato" fanno da seed;
 * 2. ogni altro studente (dai più deboli) va nel gruppo dove il guadagno di copertura è massimo,
 *    rispettando dimensione massima e almeno uno slot di disponibilità in comune;
 * 3. ruolo di ciascuno = topic in cui è il più forte del gruppo.
 */
export function matchGroups(
  students: PoolStudent[],
  topics: string[],
  opts: { minSize?: number; maxSize?: number; targetSize?: number } = {},
): MatchedGroup[] {
  const { minSize = 3, maxSize = 5, targetSize = 4 } = opts;
  if (students.length === 0) return [];
  const G = Math.max(1, Math.round(students.length / targetSize));
  const strength = (s: PoolStudent) => {
    const v = topics.map((t) => s.mastery[t] ?? 0);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const max = Math.max(...v);
    return max + 0.3 * mean;
  };
  const sorted = [...students].sort((a, b) => strength(b) - strength(a) || a.id.localeCompare(b.id));
  const groups: PoolStudent[][] = sorted.slice(0, G).map((s) => [s]);
  const rest = sorted.slice(G).reverse(); // prima i più deboli: hanno più bisogno di copertura

  for (const s of rest) {
    let best = -1;
    let bestGain = -Infinity;
    groups.forEach((g, gi) => {
      if (g.length >= maxSize) return;
      const slots = sharedSlots([...g, s]);
      if (slots.length === 0) return;
      const before = coverageScore(groupCoverage(g, topics), topics);
      // guadagno: copertura che lo studente porta + copertura che riceve sulle sue lacune
      const after = coverageScore(groupCoverage([...g, s], topics), topics);
      const received = topics.reduce((acc, t) => acc + Math.max(0, Math.max(...g.map((m) => m.mastery[t] ?? 0)) - (s.mastery[t] ?? 0)), 0) / topics.length;
      const gain = (after - before) + 0.5 * received + slots.length * 2 - g.length * 3;
      if (gain > bestGain) {
        bestGain = gain;
        best = gi;
      }
    });
    if (best === -1) best = groups.reduce((m, g, i) => (g.length < groups[m].length ? i : m), 0);
    groups[best].push(s);
  }

  // gruppi troppo piccoli: fondi nel gruppo con meno membri
  const final = groups.filter((g) => g.length >= minSize);
  for (const small of groups.filter((g) => g.length < minSize)) {
    for (const s of small) {
      const target = final.length ? final.reduce((m, g) => (g.length < m.length ? g : m), final[0]) : small;
      if (target !== small) target.push(s);
    }
    if (!final.length) final.push(small);
  }

  return final.map((g) => {
    const coverage = groupCoverage(g, topics);
    const used = new Set<string>();
    const members = g.map((m) => {
      const candidates = topics
        .filter((t) => (m.mastery[t] ?? 0) >= coverage[t] - 0.01 && !used.has(t))
        .sort((a, b) => (m.mastery[b] ?? 0) - (m.mastery[a] ?? 0));
      const roleTopicId = candidates[0] ?? null;
      if (roleTopicId) used.add(roleTopicId);
      return { id: m.id, name: m.name, roleTopicId };
    });
    return {
      members,
      coverage: Object.fromEntries(Object.entries(coverage).map(([k, v]) => [k, round(v, 0)])),
      coverageScore: round(coverageScore(coverage, topics), 1),
      sharedSlots: sharedSlots(g),
    };
  });
}
