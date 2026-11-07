import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseDetailView } from '@/components/course-detail-view';
import { CourseRow, ExamRow } from '@/components/course-row';
import {
  GlassContainer,
  LiquidGlassBackdrop,
  LiquidGlassCard,
} from '@/components/liquid-glass';
import { useProfile } from '@/context/profile-context';
import { computeCourseScore } from '@/utils/score-calculator';

export default function CoursesScreen() {
  const isDark = useColorScheme() === 'dark';
  const {
    activeProfile,
    activeProfileId,
    courses,
    upcomingExams,
    quizAttempts,
  } = useProfile();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCourseId(null);
  }, [activeProfileId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';

  if (selectedCourse) {
    return (
      <View style={styles.root}>
        <LiquidGlassBackdrop />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <CourseDetailView
            course={selectedCourse}
            onBack={() => setSelectedCourseId(null)}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>Courses</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              {activeProfile.course} · {activeProfile.yearOfStudy}
            </Text>
          </View>

          <GlassContainer spacing={20} style={styles.sectionsContainer}>
            {/* Courses Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: textSecondary }]}>
                COURSES
              </Text>

              <LiquidGlassCard style={styles.groupedCard}>
                {courses.map((course, idx) => {
                  const summary = computeCourseScore(course, quizAttempts);
                  return (
                    <CourseRow
                      key={course.id}
                      course={course}
                      pendingCount={summary.pendingCount}
                      showDivider={idx < courses.length - 1}
                      onPress={() => setSelectedCourseId(course.id)}
                    />
                  );
                })}
              </LiquidGlassCard>
            </View>

            {/* Upcoming Exams Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: textSecondary }]}>
                  UPCOMING EXAMS
                </Text>
                <Text style={[styles.seeAllText, { color: accentColor }]}>
                  See all ({upcomingExams.length})
                </Text>
              </View>

              <LiquidGlassCard style={styles.groupedCard}>
                {upcomingExams.map((exam, idx) => (
                  <ExamRow
                    key={exam.id}
                    exam={exam}
                    showDivider={idx < upcomingExams.length - 1}
                  />
                ))}
              </LiquidGlassCard>
            </View>
          </GlassContainer>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  groupedCard: {
    paddingVertical: 4,
  },
});
