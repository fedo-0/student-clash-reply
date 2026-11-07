import { type SFSymbol } from 'expo-symbols';

import { type TutorModeId } from '@/types/tutor';

export interface TutorModeDefinition {
  id: TutorModeId;
  label: string;
  shortLabel: string;
  symbol: SFSymbol;
  description: string;
  /** Instructions appended to the system prompt for this mode. */
  instructions: string;
  /** Suggested first prompts. `{course}` is replaced with the course name. */
  starters: string[];
}

export const TUTOR_MODES: TutorModeDefinition[] = [
  {
    id: 'study',
    label: 'Study Buddy',
    shortLabel: 'Study',
    symbol: 'book.fill',
    description: 'Socratic help on any topic',
    instructions:
      'Act as a Socratic study partner. Guide the student towards the answer with hints and ' +
      'questions before revealing full solutions. Check understanding frequently.',
    starters: [
      'Help me build a study plan for {course}',
      'What should I review first for {course}?',
      'Explain my weakest topic step by step',
    ],
  },
  {
    id: 'oral-exam',
    label: 'Personas',
    shortLabel: 'Personas',
    symbol: 'person.wave.2.fill',
    description: 'Roleplay scenarios by voice',
    instructions:
      'Act as a realistic roleplay persona for the student’s field (patient, business owner, or AI client). ' +
      'Ask one scenario question at a time, wait for the student’s answer, and follow up naturally.',
    starters: [
      'Start a persona scenario for {course}',
      'Challenge me with a realistic case on {course}',
      'Run a 3-question scenario simulation',
    ],
  },
  {
    id: 'quiz-me',
    label: 'Quiz Me',
    shortLabel: 'Quiz',
    symbol: 'checklist',
    description: 'Rapid-fire questions with feedback',
    instructions:
      'Run a rapid quiz. Ask one question at a time (multiple choice or short answer), wait for ' +
      'the answer, then say if it is correct, explain briefly, and keep a running score. Focus on ' +
      'the weakest topics first.',
    starters: [
      'Quiz me on my weakest topic',
      'Give me 5 multiple-choice questions on {course}',
      'Test me on definitions for {course}',
    ],
  },
  {
    id: 'explain',
    label: 'Explain Like a Pro',
    shortLabel: 'Explain',
    symbol: 'lightbulb.fill',
    description: 'Clear explanations with examples',
    instructions:
      'Explain concepts clearly and concisely, starting from intuition, then the formal ' +
      'definition, then a concrete example. Use analogies when helpful.',
    starters: [
      'Explain the key concepts of {course} simply',
      'Give me a real-world example for {course}',
      'Summarize {course} in 10 bullet points',
    ],
  },
];

export function getTutorMode(id: TutorModeId): TutorModeDefinition {
  return TUTOR_MODES.find((mode) => mode.id === id) ?? TUTOR_MODES[0];
}
