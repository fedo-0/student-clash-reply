import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { type CourseItem, type ExamStatus } from '@/data/courses';

interface CourseRowProps {
  course: CourseItem;
  pendingCount: number;
  showDivider?: boolean;
  onPress: () => void;
}

export function CourseRow({
  course,
  pendingCount,
  showDivider = false,
  onPress,
}: CourseRowProps) {
  const isDark = useColorScheme() === 'dark';

  const titleColor = isDark ? '#F5F7FA' : '#0F172A';
  const subtitleColor = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const chevronColor = isDark
    ? 'rgba(235, 235, 245, 0.45)'
    : 'rgba(15, 23, 42, 0.40)';
  const dividerColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const dotBorder = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(255, 255, 255, 0.85)';

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && { opacity: 0.68 },
        ]}>
        <View
          style={[
            styles.colorDot,
            { backgroundColor: course.color, borderColor: dotBorder },
          ]}
        />

        <View style={styles.textColumn}>
          <Text
            numberOfLines={1}
            style={[styles.courseTitle, { color: titleColor }]}>
            {course.name}
          </Text>
          <Text style={[styles.creditsText, { color: subtitleColor }]}>
            {course.credits} credits
          </Text>
        </View>

        <View style={styles.rightCluster}>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
          <Text style={[styles.chevron, { color: chevronColor }]}>›</Text>
        </View>
      </Pressable>

      {showDivider && (
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      )}
    </View>
  );
}

interface ExamRowProps {
  exam: ExamStatus;
  showDivider?: boolean;
}

export function ExamRow({ exam, showDivider = false }: ExamRowProps) {
  const isDark = useColorScheme() === 'dark';

  const titleColor = isDark ? '#F5F7FA' : '#0F172A';
  const metaColor = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const chevronColor = isDark
    ? 'rgba(235, 235, 245, 0.45)'
    : 'rgba(15, 23, 42, 0.40)';
  const dividerColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const dotBorder = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(255, 255, 255, 0.85)';

  const isBooked = exam.status === 'Booked';
  const pillBg = isBooked
    ? isDark
      ? 'rgba(52, 211, 153, 0.20)'
      : 'rgba(16, 185, 129, 0.14)'
    : isDark
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(15, 23, 42, 0.07)';
  const pillText = isBooked
    ? isDark
      ? '#6EE7B7'
      : '#047857'
    : isDark
      ? 'rgba(235, 235, 245, 0.72)'
      : 'rgba(15, 23, 42, 0.65)';

  return (
    <View>
      <View style={styles.row}>
        <View
          style={[
            styles.colorDot,
            { backgroundColor: exam.color, borderColor: dotBorder },
          ]}
        />

        <View style={styles.textColumn}>
          <Text
            numberOfLines={1}
            style={[styles.courseTitle, { color: titleColor }]}>
            {exam.courseName}
          </Text>
          <View style={styles.examMetaRow}>
            <Text style={[styles.examMetaText, { color: metaColor }]}>
              {exam.date}
            </Text>
            <Text style={[styles.metaDot, { color: metaColor }]}>·</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.examMetaText,
                styles.examRoomText,
                { color: metaColor },
              ]}>
              {exam.room}
            </Text>
          </View>
        </View>

        <View style={styles.rightCluster}>
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.statusPillText, { color: pillText }]}>
              {exam.status}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: chevronColor }]}>›</Text>
        </View>
      </View>

      {showDivider && (
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  textColumn: {
    flex: 1,
    gap: 3,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  creditsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  examMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    fontSize: 13,
    fontWeight: '600',
  },
  examMetaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  examRoomText: {
    flex: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
