import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GlassContainer,
  LiquidGlassBackdrop,
  LiquidGlassCard,
} from '@/components/liquid-glass';
import { useTutorColors } from '@/components/tutor/tutor-colors';
import { useProfile } from '@/context/profile-context';
import {
  PERSONAS_BY_PROFILE,
  type PersonaScenario,
} from '@/data/personas';
import { type ProfileId } from '@/data/profiles';

const ROLEPLAY_SUBTITLE_BY_PROFILE: Record<ProfileId, string> = {
  medicine: 'Patients describing clinical symptoms',
  economics: 'Business owners presenting a live case',
  engineering: 'Clients pitching an AI project brief',
};

interface TranscriptEntry {
  id: string;
  speaker: 'persona' | 'student';
  text: string;
}

type VoiceStage =
  | 'persona-speaking'
  | 'ready-to-speak'
  | 'student-speaking'
  | 'completed';

export default function PersonasScreen() {
  const colors = useTutorColors();
  const insets = useSafeAreaInsets();
  const { activeProfile, activeProfileId } = useProfile();

  const scenarios = PERSONAS_BY_PROFILE[activeProfileId];

  const [selectedPersona, setSelectedPersona] = useState<PersonaScenario | null>(
    null
  );
  const [showFeedback, setShowFeedback] = useState(false);

  // Voice chat state
  const [exchangeIndex, setExchangeIndex] = useState(0);
  const [stage, setStage] = useState<VoiceStage>('persona-speaking');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [liveSpeechDraft, setLiveSpeechDraft] = useState('');

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  // Reset if profile switches while open
  useEffect(() => {
    clearTimers();
    setSelectedPersona(null);
    setShowFeedback(false);
    setTranscript([]);
  }, [activeProfileId]);

  const pulse = useSharedValue(0);

  useEffect(() => {
    if (stage === 'persona-speaking' || stage === 'student-speaking') {
      const duration = stage === 'student-speaking' ? 360 : 520;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 220 });
    }
  }, [stage, pulse]);

  const micHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + pulse.value * 0.38,
    transform: [{ scale: 1.08 + pulse.value * 0.34 }],
  }));

  const micCoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  const startScenario = (persona: PersonaScenario) => {
    clearTimers();
    setSelectedPersona(persona);
    setShowFeedback(false);
    setExchangeIndex(0);
    setLiveSpeechDraft('');

    const firstPrompt = persona.exchanges[0]?.personaPrompt ?? '';
    setTranscript([
      {
        id: 'persona-0',
        speaker: 'persona',
        text: firstPrompt,
      },
    ]);
    setStage('persona-speaking');

    const t = setTimeout(() => {
      setStage('ready-to-speak');
    }, 1100);
    timersRef.current.push(t);
  };

  const handleMicPress = () => {
    if (!selectedPersona) return;

    // If the student is currently speaking, tapping finishes their turn immediately
    if (stage === 'student-speaking') {
      clearTimers();
      completeStudentTurn(exchangeIndex);
      return;
    }

    // Allow tapping even while persona-speaking to skip ahead
    if (stage !== 'ready-to-speak' && stage !== 'persona-speaking') return;

    clearTimers();
    const currentExchange = selectedPersona.exchanges[exchangeIndex];
    if (!currentExchange) return;

    setStage('student-speaking');
    const words = currentExchange.studentReply.split(' ');
    setLiveSpeechDraft('');

    // Stream simulated live transcript words while speaking
    const stepMs = Math.max(45, Math.min(85, Math.floor(1700 / words.length)));
    words.forEach((_, idx) => {
      const t = setTimeout(() => {
        setLiveSpeechDraft(words.slice(0, idx + 1).join(' '));
      }, (idx + 1) * stepMs);
      timersRef.current.push(t);
    });

    const finishTimer = setTimeout(
      () => completeStudentTurn(exchangeIndex),
      words.length * stepMs + 350
    );
    timersRef.current.push(finishTimer);
  };

  const completeStudentTurn = (turnIdx: number) => {
    if (!selectedPersona) return;
    const currentExchange = selectedPersona.exchanges[turnIdx];
    if (!currentExchange) return;

    setLiveSpeechDraft('');
    setTranscript((prev) => [
      ...prev,
      {
        id: `student-${turnIdx}`,
        speaker: 'student',
        text: currentExchange.studentReply,
      },
    ]);

    const nextIdx = turnIdx + 1;
    if (nextIdx < selectedPersona.exchanges.length) {
      setExchangeIndex(nextIdx);
      setStage('persona-speaking');

      const replyTimer = setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          {
            id: `persona-${nextIdx}`,
            speaker: 'persona',
            text: selectedPersona.exchanges[nextIdx].personaPrompt,
          },
        ]);
        const readyTimer = setTimeout(() => {
          setStage('ready-to-speak');
        }, 900);
        timersRef.current.push(readyTimer);
      }, 650);
      timersRef.current.push(replyTimer);
    } else {
      setStage('persona-speaking');
      const closingTimer = setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          {
            id: 'persona-closing',
            speaker: 'persona',
            text: selectedPersona.closingLine,
          },
        ]);
        setStage('completed');
      }, 650);
      timersRef.current.push(closingTimer);
    }
  };

  const handleEndSession = () => {
    clearTimers();
    setLiveSpeechDraft('');
    setShowFeedback(true);
  };

  const handleBackToPicker = () => {
    clearTimers();
    setSelectedPersona(null);
    setShowFeedback(false);
    setTranscript([]);
    setLiveSpeechDraft('');
  };

  // ----- 1. Feedback Summary View -----
  if (selectedPersona && showFeedback) {
    const { feedback } = selectedPersona;
    const answeredCount = transcript.filter(
      (item) => item.speaker === 'student'
    ).length;
    const totalCount = selectedPersona.exchanges.length;

    return (
      <View style={styles.root}>
        <LiquidGlassBackdrop />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.navBar}>
            <Pressable
              onPress={handleBackToPicker}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.backChevron, { color: colors.accent }]}>
                ‹
              </Text>
              <Text style={[styles.backLabel, { color: colors.accent }]}>
                Personas
              </Text>
            </Pressable>
            <View style={styles.navTitleWrap}>
              <Text
                numberOfLines={1}
                style={[styles.navTitle, { color: colors.textPrimary }]}>
                Session Feedback
              </Text>
            </View>
            <View style={styles.navRightSpacer} />
          </View>

          <ScrollView
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={styles.feedbackScroll}
            showsVerticalScrollIndicator={false}>
            <LiquidGlassCard style={styles.feedbackHeroCard}>
              <Text
                style={[
                  styles.feedbackOverline,
                  { color: selectedPersona.accentColor },
                ]}>
                {selectedPersona.contextTag.toUpperCase()}
              </Text>
              <Text
                style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                {selectedPersona.name}
              </Text>
              <Text
                style={[
                  styles.feedbackScenario,
                  { color: colors.textSecondary },
                ]}>
                {selectedPersona.scenarioTitle}
              </Text>

              <View style={styles.scoreBlock}>
                <Text style={[styles.scoreBig, { color: colors.textPrimary }]}>
                  {feedback.overallScore}
                </Text>
                <Text
                  style={[
                    styles.scoreHeadline,
                    { color: colors.textSecondary },
                  ]}>
                  {feedback.headline}
                </Text>
                <Text
                  style={[styles.turnsMeta, { color: colors.textTertiary }]}>
                  {answeredCount} of {totalCount} scenario prompts completed
                </Text>
              </View>
            </LiquidGlassCard>

            <LiquidGlassCard style={styles.feedbackListCard}>
              <Text style={[styles.feedbackSectionTitle, { color: '#10B981' }]}>
                WHAT WENT WELL
              </Text>
              {feedback.strengths.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={[styles.bulletIcon, { color: '#10B981' }]}>
                    ✓
                  </Text>
                  <Text
                    style={[styles.bulletText, { color: colors.textPrimary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </LiquidGlassCard>

            <LiquidGlassCard style={styles.feedbackListCard}>
              <Text
                style={[
                  styles.feedbackSectionTitle,
                  { color: colors.accent },
                ]}>
                NEXT STEP TO IMPROVE
              </Text>
              {feedback.improvements.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={[styles.bulletIcon, { color: colors.accent }]}>
                    •
                  </Text>
                  <Text
                    style={[styles.bulletText, { color: colors.textPrimary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </LiquidGlassCard>

            <View style={styles.feedbackButtons}>
              <Pressable
                onPress={() => startScenario(selectedPersona)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.chipBackground,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textPrimary },
                  ]}>
                  Practice Again
                </Text>
              </Pressable>

              <Pressable
                onPress={handleBackToPicker}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.isDark ? '#0B0F17' : '#FFFFFF' },
                  ]}>
                  Choose Another Persona
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ----- 2. Active Voice Chat Screen -----
  if (selectedPersona) {
    const totalPrompts = selectedPersona.exchanges.length;
    const completedPrompts = transcript.filter(
      (item) => item.speaker === 'student'
    ).length;

    const statusLabel =
      stage === 'persona-speaking'
        ? `${selectedPersona.name.split(',')[0]} is speaking…`
        : stage === 'student-speaking'
          ? 'Listening — tap mic to finish answer'
          : stage === 'completed'
            ? 'Scenario complete — tap End session for feedback'
            : 'Your turn — tap the mic to respond';

    return (
      <View style={styles.root}>
        <LiquidGlassBackdrop />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {/* Top Navigation Bar with End Session */}
          <View style={styles.navBar}>
            <Pressable
              onPress={handleBackToPicker}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.backChevron, { color: colors.accent }]}>
                ‹
              </Text>
              <Text style={[styles.backLabel, { color: colors.accent }]}>
                Personas
              </Text>
            </Pressable>

            <View style={styles.navTitleWrap}>
              <Text
                numberOfLines={1}
                style={[styles.navTitle, { color: colors.textPrimary }]}>
                {selectedPersona.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.navSubtitle, { color: colors.textSecondary }]}>
                Prompt {Math.min(completedPrompts + 1, totalPrompts)} of{' '}
                {totalPrompts}
              </Text>
            </View>

            <Pressable
              onPress={handleEndSession}
              hitSlop={8}
              style={({ pressed }) => [
                styles.endSessionPill,
                {
                  backgroundColor: colors.isDark
                    ? 'rgba(255, 107, 107, 0.18)'
                    : 'rgba(229, 72, 77, 0.12)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text style={[styles.endSessionText, { color: colors.danger }]}>
                End session
              </Text>
            </Pressable>
          </View>

          {/* Persona Banner Card */}
          <View style={styles.personaBannerWrap}>
            <LiquidGlassCard style={styles.personaBannerCard}>
              <View
                style={[
                  styles.avatarBadge,
                  { backgroundColor: `${selectedPersona.accentColor}22` },
                ]}>
                <SymbolView
                  name={selectedPersona.avatarSymbol}
                  size={20}
                  tintColor={selectedPersona.accentColor}
                  fallback={
                    <Text
                      style={[
                        styles.avatarInitials,
                        { color: selectedPersona.accentColor },
                      ]}>
                      {selectedPersona.initials}
                    </Text>
                  }
                />
              </View>
              <View style={styles.personaBannerText}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.personaContextTag,
                    { color: selectedPersona.accentColor },
                  ]}>
                  {selectedPersona.contextTag}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.personaRole, { color: colors.textSecondary }]}>
                  {selectedPersona.role}
                </Text>
              </View>
            </LiquidGlassCard>
          </View>

          {/* Live Transcript ScrollView */}
          <ScrollView
            ref={scrollRef}
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcriptContent}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}>
            <Text
              style={[styles.transcriptHeader, { color: colors.textTertiary }]}>
              LIVE TRANSCRIPT
            </Text>

            {transcript.map((entry) => {
              if (entry.speaker === 'persona') {
                return (
                  <View key={entry.id} style={styles.personaBubbleWrap}>
                    <Text
                      style={[
                        styles.speakerName,
                        { color: selectedPersona.accentColor },
                      ]}>
                      {selectedPersona.name}
                    </Text>
                    <LiquidGlassCard style={styles.personaBubble}>
                      <Text
                        style={[
                          styles.personaBubbleText,
                          { color: colors.textPrimary },
                        ]}>
                        “{entry.text}”
                      </Text>
                    </LiquidGlassCard>
                  </View>
                );
              }

              return (
                <View key={entry.id} style={styles.studentBubbleWrap}>
                  <Text
                    style={[
                      styles.speakerName,
                      styles.studentSpeakerName,
                      { color: colors.textTertiary },
                    ]}>
                    You ({activeProfile.name.split(' ')[0]})
                  </Text>
                  <View
                    style={[
                      styles.studentBubble,
                      { backgroundColor: colors.accent },
                    ]}>
                    <Text style={styles.studentBubbleText}>{entry.text}</Text>
                  </View>
                </View>
              );
            })}

            {liveSpeechDraft.length > 0 && (
              <View style={styles.studentBubbleWrap}>
                <Text
                  style={[
                    styles.speakerName,
                    styles.studentSpeakerName,
                    { color: colors.accent },
                  ]}>
                  Speaking live…
                </Text>
                <View
                  style={[
                    styles.studentBubble,
                    { backgroundColor: colors.accent, opacity: 0.85 },
                  ]}>
                  <Text style={styles.studentBubbleText}>
                    {liveSpeechDraft}…
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Large Mic Dock */}
          <View
            style={[
              styles.micDock,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {statusLabel}
            </Text>

            {stage === 'completed' ? (
              <Pressable
                onPress={handleEndSession}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.fullWidthButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.isDark ? '#0B0F17' : '#FFFFFF' },
                  ]}>
                  End session & View Feedback
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleMicPress}
                accessibilityRole="button"
                accessibilityLabel={statusLabel}
                style={styles.micHitArea}>
                <Animated.View
                  style={[
                    styles.micHalo,
                    {
                      backgroundColor:
                        stage === 'student-speaking'
                          ? '#10B981'
                          : colors.accent,
                    },
                    micHaloStyle,
                  ]}
                />
                <Animated.View
                  style={[
                    styles.micButton,
                    {
                      backgroundColor:
                        stage === 'student-speaking'
                          ? '#10B981'
                          : colors.accent,
                    },
                    micCoreStyle,
                  ]}>
                  <SymbolView
                    name={
                      stage === 'student-speaking' ? 'waveform' : 'mic.fill'
                    }
                    size={34}
                    tintColor="#FFFFFF"
                    fallback={<Text style={styles.micFallback}>🎙</Text>}
                  />
                </Animated.View>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ----- 3. Persona Picker View -----
  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 },
            ]}>
            <Text style={[styles.backChevron, { color: colors.accent }]}>
              ‹
            </Text>
            <Text style={[styles.backLabel, { color: colors.accent }]}>
              Tutor
            </Text>
          </Pressable>

          <View style={styles.navTitleWrap}>
            <Text
              numberOfLines={1}
              style={[styles.navTitle, { color: colors.textPrimary }]}>
              Personas
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              {activeProfile.course}
            </Text>
          </View>

          <View style={styles.navRightSpacer} />
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.pickerScroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pickerIntro}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
              Choose a Persona
            </Text>
            <Text
              style={[styles.pickerSubtitle, { color: colors.textSecondary }]}>
              {ROLEPLAY_SUBTITLE_BY_PROFILE[activeProfileId]}. Practice answering
              out loud in a simulated voice scenario.
            </Text>
          </View>

          <GlassContainer spacing={14} style={styles.personaList}>
            {scenarios.map((persona) => (
              <Pressable
                key={persona.id}
                onPress={() => startScenario(persona)}
                style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
                <LiquidGlassCard isInteractive style={styles.personaCard}>
                  <View style={styles.personaCardTop}>
                    <View
                      style={[
                        styles.avatarBadgeLarge,
                        { backgroundColor: `${persona.accentColor}22` },
                      ]}>
                      <SymbolView
                        name={persona.avatarSymbol}
                        size={24}
                        tintColor={persona.accentColor}
                        fallback={
                          <Text
                            style={[
                              styles.avatarInitialsLarge,
                              { color: persona.accentColor },
                            ]}>
                            {persona.initials}
                          </Text>
                        }
                      />
                    </View>

                    <View style={styles.personaInfo}>
                      <View style={styles.personaTagRow}>
                        <Text
                          style={[
                            styles.personaTag,
                            { color: persona.accentColor },
                          ]}>
                          {persona.contextTag}
                        </Text>
                        <Text
                          style={[
                            styles.turnCountBadge,
                            { color: colors.textTertiary },
                          ]}>
                          {persona.exchanges.length} questions
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.personaName,
                          { color: colors.textPrimary },
                        ]}>
                        {persona.name}
                      </Text>
                      <Text
                        style={[
                          styles.personaScenarioTitle,
                          { color: colors.textSecondary },
                        ]}>
                        {persona.scenarioTitle}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.personaDescription,
                      { color: colors.textSecondary },
                    ]}>
                    {persona.role}
                  </Text>

                  <View
                    style={[
                      styles.personaCardFooter,
                      { borderTopColor: colors.divider },
                    ]}>
                    <View style={styles.voiceStartRow}>
                      <SymbolView
                        name="mic.fill"
                        size={13}
                        tintColor={colors.accent}
                        fallback={
                          <Text style={{ color: colors.accent }}>🎙</Text>
                        }
                      />
                      <Text
                        style={[
                          styles.voiceStartLabel,
                          { color: colors.accent },
                        ]}>
                        Start voice scenario
                      </Text>
                    </View>
                    <Text
                      style={[styles.chevron, { color: colors.textTertiary }]}>
                      ›
                    </Text>
                  </View>
                </LiquidGlassCard>
              </Pressable>
            ))}
          </GlassContainer>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MIC_SIZE = 84;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 82,
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
  navRightSpacer: {
    minWidth: 82,
  },
  endSessionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  endSessionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 18,
  },
  pickerIntro: {
    gap: 4,
  },
  pickerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pickerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  personaList: {
    gap: 14,
  },
  personaCard: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  personaCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBadgeLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsLarge: {
    fontSize: 17,
    fontWeight: '700',
  },
  personaInfo: {
    flex: 1,
    gap: 2,
  },
  personaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  personaTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  turnCountBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  personaName: {
    fontSize: 18,
    fontWeight: '700',
  },
  personaScenarioTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  personaCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  voiceStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceStartLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    lineHeight: 20,
  },
  personaBannerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  personaBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
  },
  personaBannerText: {
    flex: 1,
    gap: 2,
  },
  personaContextTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  personaRole: {
    fontSize: 13,
    lineHeight: 17,
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 14,
  },
  transcriptHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    paddingHorizontal: 4,
  },
  personaBubbleWrap: {
    alignItems: 'flex-start',
    paddingRight: 24,
    gap: 4,
  },
  studentBubbleWrap: {
    alignItems: 'flex-end',
    paddingLeft: 32,
    gap: 4,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  studentSpeakerName: {
    textAlign: 'right',
  },
  personaBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  personaBubbleText: {
    fontSize: 16,
    lineHeight: 23,
  },
  studentBubble: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderBottomRightRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  studentBubbleText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    lineHeight: 22,
  },
  micDock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  micHitArea: {
    width: MIC_SIZE * 1.45,
    height: MIC_SIZE * 1.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHalo: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micFallback: {
    fontSize: 30,
  },
  feedbackScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 16,
  },
  feedbackHeroCard: {
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 6,
  },
  feedbackOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackScenario: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreBlock: {
    paddingTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  scoreBig: {
    fontSize: 42,
    fontWeight: '700',
  },
  scoreHeadline: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  turnsMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  feedbackListCard: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  feedbackSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 21,
  },
  feedbackButtons: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
