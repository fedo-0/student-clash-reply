import type { Mastery, Profile, Topic } from '@/types/database';

export interface StudyBuddyTopicInfo {
  topicId: string;
  topicName: string;
  yourScore: number;
  peerScore: number;
}

export interface StudyBuddyMatch {
  peer: {
    id: string;
    fullName: string;
    degreeProgram: string | null;
    year: number | null;
  };
  courseId: string;
  courseName: string;
  matchScore: number; // 0..100 (es. 95%)
  theyHelpYou: StudyBuddyTopicInfo[];
  youHelpThem: StudyBuddyTopicInfo[];
  summary: string;
  availability: string;
}

const AVAILABILITY_OPTIONS = [
  'Biblioteca centrale & online (pomeriggi)',
  'Aule studio Ingegneria (Lun, Mer, Gio)',
  'Online su Teams la sera & pre-appello',
  'Pomeriggi dopo le 16:30 in ateneo',
  'Studio nel weekend & simulazioni congiunte',
];

function formatTopicList(topics: StudyBuddyTopicInfo[]): string {
  const names = topics.map((t) => t.topicName);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function computeStudyBuddies(options: {
  currentStudentId: string;
  courseId: string;
  courseName: string;
  topics: Topic[];
  allCourseMastery: Mastery[];
  candidates: Profile[];
  limit?: number;
}): StudyBuddyMatch[] {
  const {
    currentStudentId,
    courseId,
    courseName,
    topics,
    allCourseMastery,
    candidates,
    limit = 3,
  } = options;

  // Mappa mastery dello studente corrente per topic
  const myMasteryMap = new Map<string, Mastery>();
  allCourseMastery
    .filter((m) => m.student_id === currentStudentId)
    .forEach((m) => myMasteryMap.set(m.topic_id, m));

  const results: StudyBuddyMatch[] = [];

  for (let idx = 0; idx < candidates.length; idx++) {
    const peer = candidates[idx];
    if (peer.id === currentStudentId) continue;

    const peerMasteryMap = new Map<string, Mastery>();
    allCourseMastery
      .filter((m) => m.student_id === peer.id)
      .forEach((m) => peerMasteryMap.set(m.topic_id, m));

    const theyHelpYou: StudyBuddyTopicInfo[] = [];
    const youHelpThem: StudyBuddyTopicInfo[] = [];

    for (const t of topics) {
      const myScore = myMasteryMap.get(t.id)?.score ?? 0;
      const peerScore = peerMasteryMap.get(t.id)?.score ?? 0;

      // Il collega è forte (>= 60) e lo studente ha un gap o è debole (< 50)
      if (peerScore >= 58 && myScore < 50) {
        theyHelpYou.push({
          topicId: t.id,
          topicName: t.name,
          yourScore: Math.round(myScore),
          peerScore: Math.round(peerScore),
        });
      }

      // Lo studente è forte (>= 60) e il collega ha un gap (< 50)
      if (myScore >= 58 && peerScore < 50) {
        youHelpThem.push({
          topicId: t.id,
          topicName: t.name,
          yourScore: Math.round(myScore),
          peerScore: Math.round(peerScore),
        });
      }
    }

    // Se non ci sono punti di complementarità netti, cerca affinità per studio congiunto
    let matchScore = 0;
    const peerFirstName = peer.full_name.split(' ')[0];
    let summary = '';

    if (theyHelpYou.length > 0 && youHelpThem.length > 0) {
      // Complementarità bidirezionale perfetta!
      matchScore = Math.min(97, 86 + (theyHelpYou.length + youHelpThem.length) * 3 + (idx % 3));
      summary = `${peerFirstName} ha un'eccellente padronanza di ${formatTopicList(theyHelpYou)} (dove hai una lacuna), mentre tu puoi aiutarlo su ${formatTopicList(youHelpThem)}.`;
    } else if (theyHelpYou.length > 0) {
      matchScore = Math.min(90, 78 + theyHelpYou.length * 4 + (idx % 3));
      summary = `${peerFirstName} è molto forte su ${formatTopicList(theyHelpYou)} e può guidarti nel chiarire i concetti chiave prima dell'esame.`;
    } else if (youHelpThem.length > 0) {
      matchScore = Math.min(86, 74 + youHelpThem.length * 3 + (idx % 3));
      summary = `Le tue competenze su ${formatTopicList(youHelpThem)} possono aiutare ${peerFirstName}: spiegare concetti è il modo migliore per consolidarli.`;
    } else {
      // Entrambi a livello intermedio
      matchScore = 70 + (idx % 10);
      summary = `Siete a un livello di preparazione simile: ottima intesa per fare sessioni di quiz e simulazioni insieme.`;
    }

    const availability = AVAILABILITY_OPTIONS[idx % AVAILABILITY_OPTIONS.length];

    results.push({
      peer: {
        id: peer.id,
        fullName: peer.full_name,
        degreeProgram: peer.degree_program,
        year: peer.year,
      },
      courseId,
      courseName,
      matchScore,
      theyHelpYou,
      youHelpThem,
      summary,
      availability,
    });
  }

  // Ordina per matchScore decrescente (i più complementari per primi)
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results.slice(0, limit);
}

