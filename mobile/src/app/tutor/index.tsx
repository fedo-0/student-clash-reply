import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LiquidGlassBackdrop,
  LiquidGlassCard,
} from '@/components/liquid-glass';
import { GlassIconButton } from '@/components/tutor/glass-icon-button';
import { ThreadRow } from '@/components/tutor/thread-row';
import { useTutorColors } from '@/components/tutor/tutor-colors';
import { useProfile } from '@/context/profile-context';
import { useTutor } from '@/context/tutor-context';
import { TUTOR_MODES } from '@/data/tutor-modes';
import { type TutorModeId, type TutorThread } from '@/types/tutor';

const DAY_MS = 24 * 60 * 60 * 1000;

function groupThreads(threads: TutorThread[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();

  const groups: { label: string; items: TutorThread[] }[] = [
    { label: 'TODAY', items: [] },
    { label: 'PREVIOUS 7 DAYS', items: [] },
    { label: 'OLDER', items: [] },
  ];
  for (const thread of threads) {
    if (thread.updatedAt >= today) groups[0].items.push(thread);
    else if (thread.updatedAt >= today - 7 * DAY_MS) groups[1].items.push(thread);
    else groups[2].items.push(thread);
  }
  return groups.filter((group) => group.items.length > 0);
}

export default function TutorListScreen() {
  const colors = useTutorColors();
  const { activeProfile, activeProfileId, courses } = useProfile();
  const { threads, deleteThread } = useTutor();
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const normalizedQuery = query.trim().toLowerCase();

  const visibleThreads = threads
    .filter((thread) => thread.profileId === activeProfileId)
    .filter((thread) => !courseFilter || thread.courseId === courseFilter)
    .filter(
      (thread) =>
        !normalizedQuery ||
        thread.title.toLowerCase().includes(normalizedQuery) ||
        thread.messages.some((m) => m.content.toLowerCase().includes(normalizedQuery))
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const groups = groupThreads(visibleThreads);
  const hasAnyThreads = threads.some((thread) => thread.profileId === activeProfileId);

  const openNewChat = (options: { mode?: TutorModeId; voice?: boolean } = {}) => {
    router.push({
      pathname: '/tutor/[id]',
      params: {
        id: 'new',
        ...(courseFilter ? { courseId: courseFilter } : {}),
        ...(options.mode ? { mode: options.mode } : {}),
        ...(options.voice ? { voice: '1' } : {}),
      },
    });
  };

  const confirmDelete = (thread: TutorThread) => {
    Alert.alert('Delete chat?', `“${thread.title}” will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteThread(thread.id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header with "new chat" in the top-right margin */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Tutor</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                AI study companion for {activeProfile.name.split(' ')[0]}
              </Text>
            </View>
            <GlassIconButton
              symbol="square.and.pencil"
              fallback="+"
              accessibilityLabel="New chat"
              size={44}
              onPress={() => openNewChat()}
            />
          </View>

          {/* Search */}
          <View style={styles.section}>
            <LiquidGlassCard style={styles.searchCard}>
              <SymbolView
                name="magnifyingglass"
                size={15}
                tintColor={colors.textTertiary}
                fallback={<Text style={{ color: colors.textTertiary }}>⌕</Text>}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search chats"
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </LiquidGlassCard>
          </View>

          {/* Course filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {[{ id: null as string | null, name: 'All', color: colors.accent }, ...courses].map(
              (course) => {
                const active = courseFilter === course.id;
                return (
                  <Pressable
                    key={course.id ?? 'all'}
                    onPress={() => setCourseFilter(course.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.chipActiveBackground
                          : colors.chipBackground,
                      },
                    ]}>
                    {course.id && (
                      <View style={[styles.chipDot, { backgroundColor: course.color }]} />
                    )}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chipLabel,
                        { color: active ? colors.accent : colors.textSecondary },
                      ]}>
                      {course.name}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          <View style={styles.sections}>
            {/* Quick start */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                QUICK START
              </Text>
              <View style={styles.quickGrid}>
                <Pressable
                  style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.7 }]}
                  onPress={() => openNewChat({ voice: true })}>
                  <LiquidGlassCard isInteractive style={styles.quickCard}>
                    <SymbolView
                      name="waveform.circle.fill"
                      size={26}
                      tintColor={colors.accent}
                      fallback={<Text style={{ color: colors.accent, fontSize: 22 }}>🎙</Text>}
                    />
                    <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
                      Voice session
                    </Text>
                    <Text style={[styles.quickDesc, { color: colors.textSecondary }]}>
                      Talk it through hands-free
                    </Text>
                  </LiquidGlassCard>
                </Pressable>
                {TUTOR_MODES.filter((mode) => mode.id !== 'study').map((mode) => (
                  <Pressable
                    key={mode.id}
                    style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      if (mode.id === 'oral-exam') {
                        router.push('/tutor/personas');
                      } else {
                        openNewChat({ mode: mode.id });
                      }
                    }}>
                    <LiquidGlassCard isInteractive style={styles.quickCard}>
                      <SymbolView
                        name={mode.symbol}
                        size={22}
                        tintColor={colors.accent}
                        fallback={<Text style={{ color: colors.accent, fontSize: 20 }}>✦</Text>}
                      />
                      <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
                        {mode.label}
                      </Text>
                      <Text style={[styles.quickDesc, { color: colors.textSecondary }]}>
                        {mode.description}
                      </Text>
                    </LiquidGlassCard>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Chat history */}
            {groups.map((group) => (
              <View key={group.label} style={styles.section}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  {group.label}
                </Text>
                <LiquidGlassCard style={styles.groupedCard}>
                  {group.items.map((thread, index) => {
                    const course = thread.courseId ? courseById.get(thread.courseId) : undefined;
                    return (
                      <ThreadRow
                        key={thread.id}
                        thread={thread}
                        courseName={course?.name ?? null}
                        courseColor={course?.color ?? null}
                        showDivider={index < group.items.length - 1}
                        onPress={() =>
                          router.push({ pathname: '/tutor/[id]', params: { id: thread.id } })
                        }
                        onLongPress={() => confirmDelete(thread)}
                      />
                    );
                  })}
                </LiquidGlassCard>
              </View>
            ))}

            {groups.length === 0 && (
              <View style={styles.section}>
                <LiquidGlassCard style={styles.emptyCard}>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    {hasAnyThreads ? 'No matching chats' : 'No chats yet'}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {hasAnyThreads
                      ? 'Try a different search or course filter.'
                      : 'Tap the pencil in the top-right corner to start a new tutoring chat, by text or voice.'}
                  </Text>
                </LiquidGlassCard>
              </View>
            )}
          </View>
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  headerText: {
    flex: 1,
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
  sections: {
    gap: 24,
  },
  section: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 9,
  },
  chips: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 220,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickItem: {
    width: '48.5%',
    flexGrow: 1,
  },
  quickCard: {
    borderRadius: 20,
    padding: 14,
    gap: 6,
    minHeight: 110,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  quickDesc: {
    fontSize: 13,
    lineHeight: 17,
  },
  groupedCard: {
    paddingVertical: 2,
  },
  emptyCard: {
    padding: 20,
    gap: 6,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
