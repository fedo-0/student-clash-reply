import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@/types/database';
import { useAuth } from './AuthContext';
import { AppLayout } from './Layout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
// Studente
import { StudentHomePage } from '@/pages/student/StudentHomePage';
import { ExamDetailPage } from '@/pages/student/ExamDetailPage';
import { GradesPage } from '@/pages/student/GradesPage';
import { ProfilePage } from '@/pages/student/ProfilePage';
import { TutorPage } from '@/pages/student/TutorPage';
import { QuizPage } from '@/pages/student/QuizPage';
import { RoleplayPage } from '@/pages/student/RoleplayPage';
import { OpportunitiesPage } from '@/pages/student/OpportunitiesPage';
import { StudyGroupPage } from '@/pages/student/StudyGroupPage';
// Docente
import { TeacherHomePage } from '@/pages/teacher/TeacherHomePage';
import { ClassOverviewPage } from '@/pages/teacher/ClassOverviewPage';
import { CheckpointPage } from '@/pages/teacher/CheckpointPage';
import { QuizGeneratorPage } from '@/pages/teacher/QuizGeneratorPage';
import { PredictionPage } from '@/pages/teacher/PredictionPage';
import { FaqPage } from '@/pages/teacher/FaqPage';

function RequireRole({ role }: { role: UserRole }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={!user ? '/login' : user.role === 'teacher' ? '/teacher' : '/student'} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/student',
    element: <RequireRole role="student" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <StudentHomePage /> },
          { path: 'exams/:courseId', element: <ExamDetailPage /> },
          { path: 'grades', element: <GradesPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'tutor', element: <TutorPage /> },
          { path: 'quiz', element: <QuizPage /> },
          { path: 'roleplay', element: <RoleplayPage /> },
          { path: 'opportunities', element: <OpportunitiesPage /> },
          { path: 'group', element: <StudyGroupPage /> },
        ],
      },
    ],
  },
  {
    path: '/teacher',
    element: <RequireRole role="teacher" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <TeacherHomePage /> },
          { path: 'class', element: <ClassOverviewPage /> },
          { path: 'checkpoint', element: <CheckpointPage /> },
          { path: 'quiz-generator', element: <QuizGeneratorPage /> },
          { path: 'prediction', element: <PredictionPage /> },
          { path: 'faq', element: <FaqPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
