import {
  BookOpenCheck, Bot, Briefcase, CalendarCheck, GraduationCap, Home, LayoutGrid, LineChart, MessageCircleQuestion,
  Sparkles, Theater, UserRound, Users, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  section?: string;
}

export const STUDENT_NAV: NavItem[] = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/grades', label: 'Libretto', icon: GraduationCap },
  { to: '/student/profile', label: 'Profilo competenze', icon: UserRound },
  { to: '/student/tutor', label: 'Tutor AI', icon: Bot, section: 'Studio' },
  { to: '/student/quiz', label: 'Quiz', icon: BookOpenCheck, section: 'Studio' },
  { to: '/student/roleplay', label: 'Simulatore', icon: Theater, section: 'Studio' },
  { to: '/student/study-group', label: 'Gruppi di studio', icon: Users, section: 'Studio' },
  { to: '/student/opportunities', label: 'Opportunità', icon: Briefcase, section: 'Carriera' },
];

export const TEACHER_NAV: NavItem[] = [
  { to: '/teacher', label: 'I miei corsi', icon: Home, end: true },
  { to: '/teacher/class', label: 'Overview classe', icon: LayoutGrid },
  { to: '/teacher/checkpoint', label: 'Checkpoint', icon: CalendarCheck },
  { to: '/teacher/quiz-generator', label: 'Generatore quiz', icon: Sparkles, section: 'Strumenti AI' },
  { to: '/teacher/prediction', label: 'Stima voti', icon: LineChart, section: 'Strumenti AI' },
  { to: '/teacher/faq', label: 'Domande frequenti', icon: MessageCircleQuestion, section: 'Strumenti AI' },
];

