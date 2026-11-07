import { type ProfileId } from '@/data/profiles';

export type TutorModeId = 'study' | 'oral-exam' | 'quiz-me' | 'explain';

export type TutorRole = 'user' | 'assistant';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  createdAt: number;
  /** True if the message was spoken (user) or produced in a voice session (assistant). */
  viaVoice?: boolean;
  /** True if generation failed for this assistant message. */
  isError?: boolean;
}

export interface TutorThread {
  id: string;
  profileId: ProfileId;
  courseId: string | null;
  mode: TutorModeId;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: TutorMessage[];
}
