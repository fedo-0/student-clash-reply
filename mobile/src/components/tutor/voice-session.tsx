import { useAudioPlayer } from 'expo-audio';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiquidGlassBackdrop, LiquidGlassCard } from '@/components/liquid-glass';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { getSpeechUrl, logTutorEvent, toSpeakableText, transcribeRecording } from '@/lib/tutor-api';

import { useTutorColors } from './tutor-colors';

type Phase = 'starting' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'paused';

interface VoiceSessionProps {
  title: string;
  subtitle: string;
  /** Latest assistant text in the thread, used for live captions. */
  latestReply: string;
  /** Sends the transcript to the tutor and resolves with the reply text. */
  onUtterance: (text: string) => Promise<string | null>;
  onClose: () => void;
  voice?: string;
}

/** dBFS above which we consider the user to be speaking. */
const SPEECH_THRESHOLD_DB = -38;
/** How long the user must be silent (after speaking) before we auto-send. */
const SILENCE_TIMEOUT_MS = 1400;
const MAX_TURN_MS = 60_000;

const PHASE_LABEL: Record<Phase, string> = {
  starting: 'Connecting…',
  listening: 'Listening — tap when you’re done',
  transcribing: 'Got it…',
  thinking: 'Thinking…',
  speaking: 'Speaking — tap to interrupt',
  paused: 'Paused — tap the orb to talk',
};

function ControlButton({
  symbol,
  fallback,
  label,
  onPress,
  tint,
}: {
  symbol: SFSymbol;
  fallback: string;
  label: string;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.controlWrap, pressed && { opacity: 0.7 }]}>
      <LiquidGlassCard isInteractive style={styles.controlButton}>
        <SymbolView
          name={symbol}
          size={22}
          tintColor={tint}
          weight="semibold"
          fallback={<Text style={{ color: tint, fontSize: 20 }}>{fallback}</Text>}
        />
      </LiquidGlassCard>
      <Text style={[styles.controlLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

export function VoiceSession({
  title,
  subtitle,
  latestReply,
  onUtterance,
  onClose,
  voice,
}: VoiceSessionProps) {
  const colors = useTutorColors();
  const recorder = useVoiceRecorder();
  const player = useAudioPlayer(null);

  const [phase, setPhaseState] = useState<Phase>('starting');
  const [userCaption, setUserCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const phaseRef = useRef<Phase>('starting');
  const closedRef = useRef(false);
  const speechStartedRef = useRef(false);
  const silenceSinceRef = useRef<number | null>(null);
  const turnStartedAtRef = useRef(0);
  const onUtteranceRef = useRef(onUtterance);

  useEffect(() => {
    onUtteranceRef.current = onUtterance;
  });

  const level = useSharedValue(0);
  const pulse = useSharedValue(0);

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const startListening = async () => {
    if (closedRef.current) return;
    setError(null);
    try {
      player.pause();
      await recorder.start();
      speechStartedRef.current = false;
      silenceSinceRef.current = null;
      turnStartedAtRef.current = Date.now();
      setPhase('listening');
    } catch (err) {
      logTutorEvent('error', 'voice:mic', 'Unable to start microphone in VoiceSession', err);
      setError(err instanceof Error ? err.message : 'Unable to access the microphone');
      setPhase('paused');
    }
  };

  const speak = (reply: string) => {
    const spoken = toSpeakableText(reply);
    if (!spoken) {
      startListening();
      return;
    }
    try {
      player.replace({ uri: getSpeechUrl(spoken, voice) });
      player.play();
      setPhase('speaking');
    } catch (err) {
      logTutorEvent('error', 'voice:tts', 'Unable to play TTS audio in VoiceSession', err);
      setError(err instanceof Error ? err.message : 'Unable to play audio');
      setPhase('paused');
    }
  };

  const finishTurn = async () => {
    if (phaseRef.current !== 'listening') return;
    setPhase('transcribing');
    const uri = await recorder.stop();
    if (closedRef.current) return;
    if (!uri) {
      startListening();
      return;
    }

    try {
      const transcript = await transcribeRecording(uri);
      if (closedRef.current) return;
      if (!transcript.trim()) {
        startListening();
        return;
      }
      setUserCaption(transcript);
      setPhase('thinking');
      const reply = await onUtteranceRef.current(transcript);
      if (closedRef.current) return;
      if (!reply) {
        setError('The tutor couldn’t answer. Tap the orb to try again.');
        setPhase('paused');
        return;
      }
      speak(reply);
    } catch (err) {
      if (closedRef.current) return;
      logTutorEvent('error', 'voice:turn', 'Voice turn failed', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('paused');
    }
  };

  const pauseListening = async () => {
    if (phaseRef.current === 'listening') {
      await recorder.stop();
    }
    player.pause();
    setPhase('paused');
  };

  const handleOrbPress = () => {
    switch (phaseRef.current) {
      case 'listening':
        finishTurn();
        break;
      case 'speaking':
        startListening();
        break;
      case 'paused':
        startListening();
        break;
      default:
        break;
    }
  };

  const handleClose = async () => {
    closedRef.current = true;
    player.pause();
    await recorder.stop().catch(() => null);
    onClose();
  };

  // Kick off the first turn when the session opens.
  useEffect(() => {
    startListening();
    return () => {
      closedRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // When the tutor finishes speaking, hand the floor back to the student.
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && phaseRef.current === 'speaking') {
        startListening();
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- player is stable
  }, [player]);

  // Mic level metering + automatic end-of-speech detection.
  useEffect(() => {
    if (phase !== 'listening') {
      level.value = withTiming(0, { duration: 250 });
      return;
    }
    const interval = setInterval(() => {
      const db = recorder.getLevel();
      level.value = withTiming(Math.max(0, Math.min(1, (db + 55) / 50)), { duration: 90 });

      const now = Date.now();
      if (db > SPEECH_THRESHOLD_DB) {
        speechStartedRef.current = true;
        silenceSinceRef.current = null;
      } else if (speechStartedRef.current) {
        silenceSinceRef.current ??= now;
        if (now - silenceSinceRef.current > SILENCE_TIMEOUT_MS) finishTurn();
      }
      if (now - turnStartedAtRef.current > MAX_TURN_MS) finishTurn();
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- driven by phase only
  }, [phase]);

  // Idle "breathing" animation for thinking / speaking states.
  useEffect(() => {
    if (phase === 'speaking' || phase === 'thinking' || phase === 'transcribing') {
      const duration = phase === 'speaking' ? 420 : 900;
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
      pulse.value = withTiming(0, { duration: 250 });
    }
  }, [phase, pulse]);

  const coreStyle = useAnimatedStyle(() => {
    const energy = Math.max(level.value, pulse.value * 0.6);
    return { transform: [{ scale: 1 + energy * 0.18 }] };
  });
  const haloStyle = useAnimatedStyle(() => {
    const energy = Math.max(level.value, pulse.value * 0.6);
    return {
      opacity: 0.25 + energy * 0.45,
      transform: [{ scale: 1.15 + energy * 0.5 }],
    };
  });
  const outerHaloStyle = useAnimatedStyle(() => {
    const energy = Math.max(level.value, pulse.value * 0.6);
    return {
      opacity: 0.12 + energy * 0.25,
      transform: [{ scale: 1.4 + energy * 0.8 }],
    };
  });

  const showReply = phase === 'thinking' || phase === 'speaking';
  const orbColor = phase === 'paused' ? colors.textTertiary : colors.accent;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}>
      <View style={styles.root}>
        <LiquidGlassBackdrop />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>

          <View style={styles.orbArea}>
            <Pressable
              onPress={handleOrbPress}
              accessibilityRole="button"
              accessibilityLabel={PHASE_LABEL[phase]}
              style={styles.orbPressable}>
              <Animated.View
                style={[styles.orb, styles.orbHalo, { backgroundColor: orbColor }, outerHaloStyle]}
              />
              <Animated.View
                style={[styles.orb, styles.orbHalo, { backgroundColor: orbColor }, haloStyle]}
              />
              <Animated.View style={[styles.orb, { backgroundColor: orbColor }, coreStyle]}>
                <SymbolView
                  name={
                    phase === 'speaking'
                      ? 'waveform'
                      : phase === 'paused'
                        ? 'mic.slash.fill'
                        : 'mic.fill'
                  }
                  size={44}
                  tintColor="#FFFFFF"
                  fallback={<Text style={styles.orbFallback}>🎙</Text>}
                />
              </Animated.View>
            </Pressable>
            <Text style={[styles.phaseLabel, { color: colors.textSecondary }]}>
              {PHASE_LABEL[phase]}
            </Text>
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          </View>

          <ScrollView
            style={styles.captions}
            contentContainerStyle={styles.captionsContent}
            showsVerticalScrollIndicator={false}>
            {userCaption.length > 0 && (
              <Text style={[styles.userCaption, { color: colors.textSecondary }]}>
                “{userCaption}”
              </Text>
            )}
            {showReply && latestReply.length > 0 && (
              <Text style={[styles.replyCaption, { color: colors.textPrimary }]}>
                {toSpeakableText(latestReply)}
              </Text>
            )}
          </ScrollView>

          <View style={styles.controls}>
            <ControlButton
              symbol={phase === 'paused' ? 'mic.fill' : 'pause.fill'}
              fallback={phase === 'paused' ? '🎙' : 'Ⅱ'}
              label={phase === 'paused' ? 'Resume' : 'Pause'}
              tint={colors.textPrimary}
              onPress={phase === 'paused' ? startListening : pauseListening}
            />
            <ControlButton
              symbol="xmark"
              fallback="✕"
              label="End"
              tint={colors.danger}
              onPress={handleClose}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const ORB_SIZE = 150;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  orbArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  orbPressable: {
    width: ORB_SIZE * 2,
    height: ORB_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbHalo: {
    position: 'absolute',
  },
  orbFallback: {
    fontSize: 40,
  },
  phaseLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  captions: {
    maxHeight: 180,
    flexGrow: 0,
  },
  captionsContent: {
    paddingHorizontal: 28,
    gap: 10,
  },
  userCaption: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  replyCaption: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingVertical: 20,
  },
  controlWrap: {
    alignItems: 'center',
    gap: 6,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
