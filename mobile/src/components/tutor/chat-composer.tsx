import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { transcribeRecording } from '@/lib/tutor-api';

import { useTutorColors } from './tutor-colors';

interface ChatComposerProps {
  isResponding: boolean;
  onSend: (text: string, viaVoice: boolean) => void;
  onStop: () => void;
  onOpenVoiceMode: () => void;
}

function RoundButton({
  symbol,
  fallback,
  onPress,
  background,
  tint,
  label,
  disabled,
}: {
  symbol: SFSymbol;
  fallback: string;
  onPress: () => void;
  background: string;
  tint: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}>
      <SymbolView
        name={symbol}
        size={17}
        tintColor={tint}
        weight="bold"
        fallback={<Text style={{ color: tint, fontWeight: '700' }}>{fallback}</Text>}
      />
    </Pressable>
  );
}

export function ChatComposer({
  isResponding,
  onSend,
  onStop,
  onOpenVoiceMode,
}: ChatComposerProps) {
  const colors = useTutorColors();
  const recorder = useVoiceRecorder();
  const [text, setText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [level, setLevel] = useState(0);
  const [dictatedText, setDictatedText] = useState(false);

  const isDictating = recorder.isRecording;

  // Poll mic level for the dictation meter.
  useEffect(() => {
    if (!isDictating) return;
    const interval = setInterval(() => {
      const db = recorder.getLevel();
      setLevel(Math.max(0, Math.min(1, (db + 60) / 60)));
    }, 90);
    return () => clearInterval(interval);
  }, [isDictating, recorder]);

  const startDictation = async () => {
    try {
      await recorder.start();
    } catch (error) {
      Alert.alert('Microphone', error instanceof Error ? error.message : 'Unable to record');
    }
  };

  const finishDictation = async () => {
    const uri = await recorder.stop();
    if (!uri) return;
    setIsTranscribing(true);
    try {
      const transcript = await transcribeRecording(uri);
      if (transcript) {
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setDictatedText(true);
      }
    } catch (error) {
      Alert.alert('Transcription failed', error instanceof Error ? error.message : 'Try again');
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelDictation = async () => {
    await recorder.stop();
  };

  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value, dictatedText);
    setText('');
    setDictatedText(false);
  };

  const hasText = text.trim().length > 0;

  return (
    <LiquidGlassCard style={styles.container}>
      {isDictating ? (
        <View style={styles.dictationRow}>
          <RoundButton
            symbol="xmark"
            fallback="✕"
            label="Cancel dictation"
            onPress={cancelDictation}
            background={colors.chipBackground}
            tint={colors.textSecondary}
          />
          <View style={styles.meter}>
            {Array.from({ length: 24 }).map((_, index) => {
              const wave = Math.abs(Math.sin((index + 1) * 1.7));
              const height = 4 + level * 22 * (0.35 + 0.65 * wave);
              return (
                <View
                  key={index}
                  style={[styles.meterBar, { height, backgroundColor: colors.accent }]}
                />
              );
            })}
          </View>
          <RoundButton
            symbol="checkmark"
            fallback="✓"
            label="Finish dictation"
            onPress={finishDictation}
            background={colors.accent}
            tint="#FFFFFF"
          />
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={isTranscribing ? 'Transcribing…' : 'Ask your tutor anything'}
            placeholderTextColor={colors.textTertiary}
            multiline
            editable={!isTranscribing}
            style={[styles.input, { color: colors.textPrimary }]}
          />

          {isTranscribing ? (
            <View style={styles.roundButton}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : (
            <RoundButton
              symbol="mic"
              fallback="🎙"
              label="Dictate a message"
              onPress={startDictation}
              background="transparent"
              tint={colors.textSecondary}
              disabled={isResponding}
            />
          )}

          {isResponding ? (
            <RoundButton
              symbol="stop.fill"
              fallback="■"
              label="Stop generating"
              onPress={onStop}
              background={colors.textPrimary}
              tint={colors.isDark ? '#0B040A' : '#FFFFFF'}
            />
          ) : hasText ? (
            <RoundButton
              symbol="arrow.up"
              fallback="↑"
              label="Send message"
              onPress={handleSend}
              background={colors.accent}
              tint="#FFFFFF"
            />
          ) : (
            <RoundButton
              symbol="waveform"
              fallback="〰"
              label="Start voice conversation"
              onPress={onOpenVoiceMode}
              background={colors.accent}
              tint="#FFFFFF"
              disabled={isTranscribing}
            />
          )}
        </View>
      )}
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 26,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    maxHeight: 120,
    paddingTop: 9,
    paddingBottom: 9,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dictationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: -10,
  },
  meter: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  meterBar: {
    width: 3,
    borderRadius: 2,
  },
});
