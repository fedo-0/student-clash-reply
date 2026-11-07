import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiquidGlassBackdrop, LiquidGlassCard } from '@/components/liquid-glass';
import { ChatComposer } from '@/components/tutor/chat-composer';
import { GlassIconButton } from '@/components/tutor/glass-icon-button';
import { MessageBubble } from '@/components/tutor/message-bubble';
import { useTutorColors } from '@/components/tutor/tutor-colors';
import { VoiceSession } from '@/components/tutor/voice-session';
import { useProfile } from '@/context/profile-context';
import { getTutorMode, TUTOR_MODES } from '@/data/tutor-modes';
import { useTutorChat } from '@/hooks/use-tutor-chat';
import { getSpeechUrl, toSpeakableText } from '@/lib/tutor-api';
import { type TutorMessage, type TutorModeId } from '@/types/tutor';

function isModeId(value: unknown): value is TutorModeId {
  return TUTOR_MODES.some((mode) => mode.id === value);
}

export default function TutorChatScreen() {
  const colors = useTutorColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    courseId?: string;
    mode?: string;
    voice?: string;
  }>();
  const { courses, activeProfile } = useProfile();

  const threadId = params.id && params.id !== 'new' ? params.id : null;

  const [draftCourseId, setDraftCourseId] = useState<string | null>(
    params.courseId && courses.some((c) => c.id === params.courseId) ? params.courseId : null
  );
  const [draftMode, setDraftMode] = useState<TutorModeId>(
    isModeId(params.mode) ? params.mode : 'study'
  );
  const [voiceOpen, setVoiceOpen] = useState(params.voice === '1');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const { thread, course, mode, isResponding, send, stop, retry } = useTutorChat({
    threadId,
    draftCourseId,
    draftMode,
    onThreadCreated: (created) => router.setParams({ id: created.id, voice: undefined }),
  });

  const modeDef = getTutorMode(mode);
  const messages = thread?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const latestReply =
    [...messages].reverse().find((message) => message.role === 'assistant')?.content ?? '';

  // ----- Read-aloud for individual replies -----
  const player = useAudioPlayer(null);
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) setSpeakingId(null);
    });
    return () => subscription.remove();
  }, [player]);

  const toggleSpeak = async (message: TutorMessage) => {
    if (speakingId === message.id) {
      player.pause();
      setSpeakingId(null);
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.replace({ uri: getSpeechUrl(toSpeakableText(message.content)) });
      player.play();
      setSpeakingId(message.id);
    } catch {
      setSpeakingId(null);
    }
  };

  // ----- Auto-scroll -----
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const startNewChat = () => {
    stop();
    player.pause();
    setSpeakingId(null);
    setDraftCourseId(course?.id ?? null);
    setDraftMode('study');
    router.setParams({ id: 'new', voice: undefined, mode: undefined });
  };

  const openVoice = () => {
    player.pause();
    setSpeakingId(null);
    setVoiceOpen(true);
  };

  if (threadId && !thread) {
    return (
      <View style={styles.root}>
        <LiquidGlassBackdrop />
        <SafeAreaView style={[styles.container, styles.centered]}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Chat not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.link, { color: colors.accent }]}>Back to Tutor</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const courseLabel = course?.name ?? 'All courses';
  const isDraft = !thread;

  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Nav bar: back · title · new chat (top-right) */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
            <Text style={[styles.backChevron, { color: colors.accent }]}>‹</Text>
            <Text style={[styles.backLabel, { color: colors.accent }]}>Tutor</Text>
          </Pressable>

          <View style={styles.navTitleWrap}>
            <Text numberOfLines={1} style={[styles.navTitle, { color: colors.textPrimary }]}>
              {thread?.title ?? 'New chat'}
            </Text>
            <Text numberOfLines={1} style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              {modeDef.shortLabel} · {courseLabel}
            </Text>
          </View>

          <GlassIconButton
            symbol="square.and.pencil"
            fallback="+"
            accessibilityLabel="New chat"
            size={38}
            onPress={startNewChat}
            disabled={isDraft}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}>
            {isDraft ? (
              <View style={styles.draft}>
                <View style={styles.draftHero}>
                  <SymbolView
                    name="graduationcap.fill"
                    size={40}
                    tintColor={colors.accent}
                    fallback={<Text style={{ fontSize: 36 }}>🎓</Text>}
                  />
                  <Text style={[styles.draftTitle, { color: colors.textPrimary }]}>
                    How can I help, {activeProfile.name.split(' ')[0]}?
                  </Text>
                  <Text style={[styles.draftSubtitle, { color: colors.textSecondary }]}>
                    Type below, or tap the waveform to talk.
                  </Text>
                </View>

                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>MODE</Text>
                <View style={styles.modeGrid}>
                  {TUTOR_MODES.map((item) => {
                    const active = item.id === draftMode;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          if (item.id === 'oral-exam') {
                            router.push('/tutor/personas');
                          } else {
                            setDraftMode(item.id);
                          }
                        }}
                        style={[
                          styles.modeChip,
                          {
                            backgroundColor: active
                              ? colors.chipActiveBackground
                              : colors.chipBackground,
                            borderColor: active ? colors.accent : 'transparent',
                          },
                        ]}>
                        <SymbolView
                          name={item.symbol}
                          size={15}
                          tintColor={active ? colors.accent : colors.textSecondary}
                          fallback={<Text>•</Text>}
                        />
                        <Text
                          style={[
                            styles.modeLabel,
                            { color: active ? colors.accent : colors.textPrimary },
                          ]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>COURSE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.courseChips}>
                  {[{ id: null as string | null, name: 'All courses', color: colors.accent }, ...courses].map(
                    (item) => {
                      const active = item.id === draftCourseId;
                      return (
                        <Pressable
                          key={item.id ?? 'all'}
                          onPress={() => setDraftCourseId(item.id)}
                          style={[
                            styles.courseChip,
                            {
                              backgroundColor: active
                                ? colors.chipActiveBackground
                                : colors.chipBackground,
                            },
                          ]}>
                          {item.id && (
                            <View style={[styles.dot, { backgroundColor: item.color }]} />
                          )}
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.courseChipLabel,
                              { color: active ? colors.accent : colors.textSecondary },
                            ]}>
                            {item.name}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </ScrollView>

                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  TRY ASKING
                </Text>
                <View style={styles.starters}>
                  {getTutorMode(draftMode).starters.map((starter) => {
                    const prompt = starter.replace('{course}', course?.name ?? 'my courses');
                    return (
                      <Pressable
                        key={starter}
                        onPress={() => send(prompt)}
                        style={({ pressed }) => pressed && { opacity: 0.7 }}>
                        <LiquidGlassCard isInteractive style={styles.starterCard}>
                          <Text style={[styles.starterText, { color: colors.textPrimary }]}>
                            {prompt}
                          </Text>
                          <SymbolView
                            name="arrow.up.right"
                            size={13}
                            tintColor={colors.textTertiary}
                            fallback={<Text style={{ color: colors.textTertiary }}>↗</Text>}
                          />
                        </LiquidGlassCard>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={isResponding && message.id === lastMessage?.id}
                  isSpeaking={speakingId === message.id}
                  onToggleSpeak={toggleSpeak}
                  onRetry={message.isError ? () => retry(message.id) : undefined}
                />
              ))
            )}
          </ScrollView>

          <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <ChatComposer
              isResponding={isResponding}
              onSend={(text, viaVoice) => send(text, { viaVoice })}
              onStop={stop}
              onOpenVoiceMode={openVoice}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {voiceOpen && (
        <VoiceSession
          title={thread?.title ?? 'Voice session'}
          subtitle={`${modeDef.label} · ${courseLabel}`}
          latestReply={latestReply}
          onUtterance={(text) => send(text, { viaVoice: true })}
          onClose={() => {
            stop();
            setVoiceOpen(false);
          }}
        />
      )}
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
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backChevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '400',
    marginRight: 2,
  },
  backLabel: {
    fontSize: 17,
  },
  navTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  messages: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 14,
  },
  composerWrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  draft: {
    gap: 10,
  },
  draftHero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  draftTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  draftSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  courseChips: {
    gap: 8,
  },
  courseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderCurve: 'continuous',
    maxWidth: 220,
  },
  courseChipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  starters: {
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  starterText: {
    flex: 1,
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  },
});
