import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { useProfile } from '@/context/profile-context';
import { type ProfileId } from '@/data/profiles';

const MOCK_PAST_GRADES: Record<ProfileId, [number, number, number]> = {
  medicine: [27, 25, 24],
  economics: [26, 24, 25],
  engineering: [27, 25, 23],
};

type FeasibilityStatus = 'Achievable' | 'Challenging' | 'Unlikely';

export function GraduationGoalSection() {
  const isDark = useColorScheme() === 'dark';
  const { activeProfileId, courses, targetAverage, setTargetAverage } =
    useProfile();

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const separatorColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const controlBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const demoBadgeBg = isDark
    ? 'rgba(56, 189, 248, 0.16)'
    : 'rgba(0, 122, 255, 0.10)';

  const completedCourses = courses.slice(0, 3);
  const remainingCourses = courses.slice(3);
  const pastGrades = MOCK_PAST_GRADES[activeProfileId];

  const completedCredits = completedCourses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  const completedWeightedSum = completedCourses.reduce(
    (sum, course, index) => sum + course.credits * (pastGrades[index] ?? 25),
    0
  );
  const currentWeightedAvg =
    completedCredits > 0 ? completedWeightedSum / completedCredits : 25;

  const remainingCredits = remainingCourses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  const totalCredits = completedCredits + remainingCredits;

  const rawRequiredAverage =
    remainingCredits > 0
      ? (targetAverage * totalCredits - completedWeightedSum) / remainingCredits
      : targetAverage;

  let feasibility: FeasibilityStatus = 'Achievable';
  if (rawRequiredAverage > 30) {
    feasibility = 'Unlikely';
  } else if (rawRequiredAverage > 27.5) {
    feasibility = 'Challenging';
  }

  const feasibilityColors: Record<
    FeasibilityStatus,
    { bg: string; text: string; note: string }
  > = {
    Achievable: {
      bg: isDark ? 'rgba(52, 211, 153, 0.20)' : 'rgba(16, 185, 129, 0.14)',
      text: isDark ? '#6EE7B7' : '#047857',
      note: 'Well within reach based on your current credit-weighted trajectory.',
    },
    Challenging: {
      bg: isDark ? 'rgba(251, 191, 36, 0.20)' : 'rgba(245, 158, 11, 0.14)',
      text: isDark ? '#FCD34D' : '#B45309',
      note: 'Requires consistently high marks across your remaining high-CFU exams.',
    },
    Unlikely: {
      bg: isDark ? 'rgba(248, 113, 113, 0.20)' : 'rgba(239, 68, 68, 0.14)',
      text: isDark ? '#FCA5A5' : '#B91C1C',
      note: 'Exceeds the 30/30 maximum exam grade with the remaining credits.',
    },
  };

  const statusConfig = feasibilityColors[feasibility];
  const clampedRequiredAvg = Math.max(18, Math.min(30, rawRequiredAverage));
  const maxReachableAvg =
    totalCredits > 0
      ? (completedWeightedSum + remainingCredits * 30) / totalCredits
      : 30;
  const displayRequiredAvg =
    rawRequiredAverage > 30
      ? `> 30/30 (Max avg ${maxReachableAvg.toFixed(1)})`
      : `${clampedRequiredAvg.toFixed(1)}/30`;

  const getSuggestedGrade = (index: number): string => {
    if (rawRequiredAverage > 30.4) {
      return '30L';
    }
    const offsets = [0.4, 0, -0.4];
    const suggested = Math.round(rawRequiredAverage + (offsets[index] ?? 0));
    const clamped = Math.max(18, Math.min(30, suggested));
    return `${clamped}/30`;
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionHeader, { color: textSecondary }]}>
          GRADUATION AVERAGE GOAL
        </Text>
        <View style={[styles.demoBadge, { backgroundColor: demoBadgeBg }]}>
          <Text style={[styles.demoBadgeText, { color: accentColor }]}>
            DEMO ESTIMATE
          </Text>
        </View>
      </View>

      <LiquidGlassCard style={styles.card}>
        {/* Target Stepper Row */}
        <View style={styles.stepperRow}>
          <View style={styles.stepperInfo}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Target Final Average
            </Text>
            <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
              Current weighted avg: {currentWeightedAvg.toFixed(1)}/30 (
              {completedCredits} CFU passed)
            </Text>
          </View>

          <View style={[styles.stepperControl, { backgroundColor: controlBg }]}>
            <Pressable
              onPress={() => setTargetAverage(targetAverage - 1)}
              disabled={targetAverage <= 18}
              style={({ pressed }) => [
                styles.stepperButton,
                (pressed || targetAverage <= 18) && { opacity: 0.45 },
              ]}>
              <Text style={[styles.stepperButtonText, { color: textPrimary }]}>
                −
              </Text>
            </Pressable>

            <Text style={[styles.targetValue, { color: accentColor }]}>
              {targetAverage}
              <Text style={[styles.targetScale, { color: textSecondary }]}>
                /30
              </Text>
            </Text>

            <Pressable
              onPress={() => setTargetAverage(targetAverage + 1)}
              disabled={targetAverage >= 30}
              style={({ pressed }) => [
                styles.stepperButton,
                (pressed || targetAverage >= 30) && { opacity: 0.45 },
              ]}>
              <Text style={[styles.stepperButtonText, { color: textPrimary }]}>
                +
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: separatorColor }]} />

        {/* Required Average & Feasibility */}
        <View style={styles.estimateBlock}>
          <View style={styles.estimateTopRow}>
            <View style={styles.estimateMetric}>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>
                Required average ({remainingCredits} CFU left)
              </Text>
              <Text style={[styles.metricValue, { color: textPrimary }]}>
                {displayRequiredAvg}
              </Text>
            </View>

            <View
              style={[
                styles.feasibilityPill,
                { backgroundColor: statusConfig.bg },
              ]}>
              <Text
                style={[
                  styles.feasibilityPillText,
                  { color: statusConfig.text },
                ]}>
                {feasibility}
              </Text>
            </View>
          </View>

          <Text style={[styles.feasibilityNote, { color: textSecondary }]}>
            {statusConfig.note}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: separatorColor }]} />

        {/* Per-Course Suggestion List */}
        <View style={styles.suggestionsBlock}>
          <Text style={[styles.suggestionsTitle, { color: textSecondary }]}>
            Suggested grades for remaining exams
          </Text>

          <View style={styles.courseList}>
            {remainingCourses.map((course, idx) => (
              <View key={course.id} style={styles.courseSuggestionRow}>
                <View style={styles.courseLeft}>
                  <View
                    style={[
                      styles.courseDot,
                      { backgroundColor: course.color },
                    ]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.courseName, { color: textPrimary }]}>
                    {course.name}
                  </Text>
                  <Text style={[styles.courseCredits, { color: textSecondary }]}>
                    {course.credits} CFU
                  </Text>
                </View>

                <View
                  style={[styles.gradePill, { backgroundColor: controlBg }]}>
                  <Text style={[styles.gradePillText, { color: textPrimary }]}>
                    {getSuggestedGrade(idx)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </LiquidGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    gap: 8,
  },
  headerRow: {
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
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    padding: 18,
    gap: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepperInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 4,
    gap: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'center',
  },
  targetScale: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  estimateBlock: {
    gap: 6,
  },
  estimateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  estimateMetric: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  feasibilityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  feasibilityPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feasibilityNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionsBlock: {
    gap: 10,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  courseList: {
    gap: 8,
  },
  courseSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  courseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  courseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  courseCredits: {
    fontSize: 12,
    fontWeight: '500',
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gradePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
