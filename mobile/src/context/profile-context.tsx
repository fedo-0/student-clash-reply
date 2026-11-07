import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  COURSES_BY_PROFILE,
  INITIAL_QUIZ_ATTEMPTS,
  UPCOMING_EXAMS_BY_PROFILE,
  type CourseItem,
  type ExamStatus,
  type QuizAttemptRecord,
} from '@/data/courses';
import {
  OPPORTUNITIES,
  PROFILES,
  type OpportunityItem,
  type ProfileId,
  type StudentProfile,
} from '@/data/profiles';

export interface UploadedCv {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

const MOCK_CV_CANDIDATES: Record<ProfileId, UploadedCv[]> = {
  medicine: [
    {
      fileName: 'Elena_Rossi_Clinical_CV_2026.pdf',
      fileSize: '420 KB',
      uploadedAt: 'Just now',
    },
    {
      fileName: 'Elena_Rossi_Academic_Portfolio.pdf',
      fileSize: '615 KB',
      uploadedAt: 'Just now',
    },
  ],
  economics: [
    {
      fileName: 'Marco_Conti_Finance_Resume.pdf',
      fileSize: '380 KB',
      uploadedAt: 'Just now',
    },
    {
      fileName: 'Marco_Conti_Strategy_CV_v2.pdf',
      fileSize: '510 KB',
      uploadedAt: 'Just now',
    },
  ],
  engineering: [
    {
      fileName: 'Sofia_Ferri_AI_Research_CV.pdf',
      fileSize: '490 KB',
      uploadedAt: 'Just now',
    },
    {
      fileName: 'Sofia_Ferri_ML_Engineering_Resume.pdf',
      fileSize: '640 KB',
      uploadedAt: 'Just now',
    },
  ],
};

const CV_BUMPED_MATCHES: Record<string, { priority: number; tag: string }> = {
  'med-2': { priority: 1, tag: '98% CV Match · Clinical Trials' },
  'med-1': { priority: 2, tag: '95% CV Match · Cardiology' },
  'med-5': { priority: 3, tag: '92% CV Match · ECG Skills' },
  'eco-3': { priority: 1, tag: '97% CV Match · Quant Finance' },
  'eco-1': { priority: 2, tag: '94% CV Match · Fintech' },
  'eco-7': { priority: 3, tag: '91% CV Match · Portfolio Risk' },
  'eng-4': { priority: 1, tag: '98% CV Match · Edge AI' },
  'eng-1': { priority: 2, tag: '95% CV Match · Robotics R&D' },
  'eng-6': { priority: 3, tag: '92% CV Match · Computer Vision' },
};

interface ProfileContextValue {
  activeProfileId: ProfileId;
  activeProfile: StudentProfile;
  opportunities: OpportunityItem[];
  courses: CourseItem[];
  upcomingExams: ExamStatus[];
  quizAttempts: QuizAttemptRecord[];
  targetAverage: number;
  uploadedCv: UploadedCv | null;
  setActiveProfileId: (id: ProfileId) => void;
  setTargetAverage: (value: number) => void;
  uploadMockCv: () => void;
  replaceMockCv: () => void;
  removeMockCv: () => void;
  recordQuizAttempt: (
    quizId: string,
    correctCount: number,
    totalCount: number
  ) => void;
  getLatestQuizAttempt: (quizId: string) => QuizAttemptRecord | undefined;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfileId, setActiveProfileId] = useState<ProfileId>('medicine');
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>(
    INITIAL_QUIZ_ATTEMPTS
  );
  const [targetByProfile, setTargetByProfile] = useState<
    Record<ProfileId, number>
  >({
    medicine: 26,
    economics: 26,
    engineering: 26,
  });
  const [cvByProfile, setCvByProfile] = useState<
    Record<ProfileId, UploadedCv | null>
  >({
    medicine: null,
    economics: null,
    engineering: null,
  });
  const [cvVariantIndex, setCvVariantIndex] = useState<
    Record<ProfileId, number>
  >({
    medicine: 0,
    economics: 0,
    engineering: 0,
  });

  const activeProfile = PROFILES[activeProfileId];
  const targetAverage = targetByProfile[activeProfileId];
  const uploadedCv = cvByProfile[activeProfileId];

  const baseOpportunities = OPPORTUNITIES.filter(
    (item) => item.profileId === activeProfileId
  );

  const opportunities = uploadedCv
    ? [...baseOpportunities]
        .sort((a, b) => {
          const priorityA = CV_BUMPED_MATCHES[a.id]?.priority ?? 99;
          const priorityB = CV_BUMPED_MATCHES[b.id]?.priority ?? 99;
          return priorityA - priorityB;
        })
        .map((item) => {
          const bumped = CV_BUMPED_MATCHES[item.id];
          return bumped ? { ...item, interestTag: bumped.tag } : item;
        })
    : baseOpportunities;

  const courses = COURSES_BY_PROFILE[activeProfileId];
  const upcomingExams = UPCOMING_EXAMS_BY_PROFILE[activeProfileId];

  const setTargetAverage = (value: number) => {
    const clamped = Math.max(18, Math.min(30, value));
    setTargetByProfile((prev) => ({
      ...prev,
      [activeProfileId]: clamped,
    }));
  };

  const uploadMockCv = () => {
    const candidates = MOCK_CV_CANDIDATES[activeProfileId];
    const index = cvVariantIndex[activeProfileId] % candidates.length;
    setCvByProfile((prev) => ({
      ...prev,
      [activeProfileId]: candidates[index],
    }));
  };

  const replaceMockCv = () => {
    const candidates = MOCK_CV_CANDIDATES[activeProfileId];
    const nextIndex = (cvVariantIndex[activeProfileId] + 1) % candidates.length;
    setCvVariantIndex((prev) => ({
      ...prev,
      [activeProfileId]: nextIndex,
    }));
    setCvByProfile((prev) => ({
      ...prev,
      [activeProfileId]: candidates[nextIndex],
    }));
  };

  const removeMockCv = () => {
    setCvByProfile((prev) => ({
      ...prev,
      [activeProfileId]: null,
    }));
  };

  const recordQuizAttempt = (
    quizId: string,
    correctCount: number,
    totalCount: number
  ) => {
    setQuizAttempts((prev) => [
      ...prev,
      {
        quizId,
        correctCount,
        totalCount,
        timestamp: Date.now(),
      },
    ]);
  };

  const getLatestQuizAttempt = (quizId: string) => {
    let latest: QuizAttemptRecord | undefined;
    for (const attempt of quizAttempts) {
      if (
        attempt.quizId === quizId &&
        (!latest || attempt.timestamp >= latest.timestamp)
      ) {
        latest = attempt;
      }
    }
    return latest;
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfileId,
        activeProfile,
        opportunities,
        courses,
        upcomingExams,
        quizAttempts,
        targetAverage,
        uploadedCv,
        setActiveProfileId,
        setTargetAverage,
        uploadMockCv,
        replaceMockCv,
        removeMockCv,
        recordQuizAttempt,
        getLatestQuizAttempt,
      }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
