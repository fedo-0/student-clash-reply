import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { GlassContainer, LiquidGlassCard } from '@/components/liquid-glass';
import { QuizFlow } from '@/components/quiz-flow';
import { ScoreGauge } from '@/components/score-gauge';
import { useProfile } from '@/context/profile-context';
import { type CourseItem, type CourseQuiz } from '@/data/courses';
import { computeCourseScore } from '@/utils/score-calculator';

interface CourseDetailViewProps {
  course: CourseItem;
  onBack: () => void;
}

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const isDark = useColorScheme() === 'dark';
  const { quizAttempts, recordQuizAttempt, getLatestQuizAttempt } = useProfile();
  const [activeQuiz, setActiveQuiz] = useState<CourseQuiz | null>(null);

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const dividerColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const chevronColor = isDark
    ? 'rgba(235, 235, 245, 0.45)'
    : 'rgba(15, 23, 42, 0.40)';

  const scoreSummary = computeCourseScore(course, quizAttempts);

  if (activeQuiz) {
    return (
      <QuizFlow
        quiz={activeQuiz}
        courseName={course.name}
        onCancel={() => setActiveQuiz(null)}
        onComplete={(correctCount, totalCount) => {
          recordQuizAttempt(activeQuiz.id, correctCount, totalCount);
          setActiveQuiz(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Push Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={[styles.backChevron, { color: accentColor }]}>‹</Text>
          <Text style={[styles.backLabel, { color: accentColor }]}>Courses</Text>
        </Pressable>

        <Text
          numberOfLines={1}
          style={[styles.navTitle, { color: textPrimary }]}>
          {course.name}
        </Text>

        <View style={styles.navRightSpacer} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <GlassContainer spacing={24} style={styles.glassStack}>
          {/* AI Score Gauge Card */}
          <ScoreGauge summary={scoreSummary} />

          {/* Quizzes Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: textSecondary }]}>
                QUIZZES
              </Text>
              <Text style={[styles.sectionCount, { color: textSecondary }]}>
                {course.quizzes.length} topics
              </Text>
            </View>

            <LiquidGlassCard style={styles.groupedCard}>
              {course.quizzes.map((quiz, idx) => {
                const latestAttempt = getLatestQuizAttempt(quiz.id);
                const isCompleted = !!latestAttempt;
                const percentage = latestAttempt
                  ? Math.round(
                      (latestAttempt.correctCount / latestAttempt.totalCount) *
                        100
                    )
                  : 0;

                const statusBg = isCompleted
                  ? percentage >= 75
                    ? isDark
                      ? 'rgba(52, 211, 153, 0.20)'
                      : 'rgba(16, 185, 129, 0.14)'
                    : isDark
                      ? 'rgba(56, 189, 248, 0.18)'
                      : 'rgba(0, 122, 255, 0.12)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(15, 23, 42, 0.06)';

                const statusTextColor = isCompleted
                  ? percentage >= 75
                    ? isDark
                      ? '#6EE7B7'
                      : '#047857'
                    : accentColor
                  : textSecondary;

                return (
                  <View key={quiz.id}>
                    <Pressable
                      onPress={() => setActiveQuiz(quiz)}
                      style={({ pressed }) => [
                        styles.quizRow,
                        pressed && { opacity: 0.68 },
                      ]}>
                      <View
                        style={[
                          styles.quizDot,
                          { backgroundColor: course.color },
                        ]}
                      />

                      <View style={styles.quizInfoColumn}>
                        <Text
                          numberOfLines={1}
                          style={[styles.quizTopic, { color: textPrimary }]}>
                          {quiz.topic}
                        </Text>
                        <Text
                          style={[
                            styles.quizQuestionsMeta,
                            { color: textSecondary },
                          ]}>
                          {quiz.questions.length} questions
                        </Text>
                      </View>

                      <View style={styles.quizRightCluster}>
                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: statusBg },
                          ]}>
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: statusTextColor },
                            ]}>
                            {isCompleted
                              ? `Last: ${latestAttempt.correctCount}/${latestAttempt.totalCount} (${percentage}%)`
                              : 'Not started'}
                          </Text>
                        </View>
                        <Text style={[styles.chevron, { color: chevronColor }]}>
                          ›
                        </Text>
                      </View>
                    </Pressable>

                    {idx < course.quizzes.length - 1 && (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: dividerColor },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </LiquidGlassCard>
          </View>
        </GlassContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  backChevron: {
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 26,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  navRightSpacer: {
    minWidth: 80,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 110,
  },
  glassStack: {
    gap: 24,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupedCard: {
    paddingVertical: 4,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  quizDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  quizInfoColumn: {
    flex: 1,
    gap: 3,
  },
  quizTopic: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  quizQuestionsMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  quizRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
  },
});
