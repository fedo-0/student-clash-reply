import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { type TutorMessage } from '@/types/tutor';

import { MarkdownText } from './markdown-text';
import { useTutorColors } from './tutor-colors';

interface MessageBubbleProps {
  message: TutorMessage;
  isStreaming: boolean;
  isSpeaking: boolean;
  onToggleSpeak: (message: TutorMessage) => void;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isStreaming,
  isSpeaking,
  onToggleSpeak,
  onRetry,
}: MessageBubbleProps) {
  const colors = useTutorColors();

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.accent }]}>
          {message.viaVoice && (
            <SymbolView
              name="waveform"
              size={12}
              tintColor="rgba(255,255,255,0.8)"
              style={styles.voiceIcon}
              fallback={<Text style={styles.voiceFallback}>🎙</Text>}
            />
          )}
          <Text selectable style={styles.userText}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  const isEmpty = message.content.length === 0;

  return (
    <View style={styles.assistantRow}>
      <LiquidGlassCard style={styles.assistantCard}>
        {isEmpty && isStreaming ? (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
            <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>Thinking…</Text>
          </View>
        ) : (
          <MarkdownText
            text={message.content}
            color={message.isError ? colors.danger : colors.textPrimary}
          />
        )}
      </LiquidGlassCard>

      {!isStreaming && !isEmpty && (
        <View style={styles.actions}>
          {message.isError ? (
            onRetry && (
              <Pressable onPress={onRetry} hitSlop={8} style={styles.actionButton}>
                <Text style={[styles.actionLabel, { color: colors.accent }]}>Retry</Text>
              </Pressable>
            )
          ) : (
            <Pressable
              onPress={() => onToggleSpeak(message)}
              hitSlop={8}
              accessibilityLabel={isSpeaking ? 'Stop reading' : 'Read aloud'}
              style={styles.actionButton}>
              <SymbolView
                name={isSpeaking ? 'stop.circle.fill' : 'speaker.wave.2'}
                size={16}
                tintColor={isSpeaking ? colors.accent : colors.textTertiary}
                fallback={
                  <Text style={{ color: colors.textTertiary }}>{isSpeaking ? '■' : '🔊'}</Text>
                }
              />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    alignItems: 'flex-end',
    paddingLeft: 48,
  },
  userBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voiceIcon: {
    marginTop: 4,
  },
  voiceFallback: {
    fontSize: 11,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  assistantRow: {
    alignItems: 'flex-start',
    paddingRight: 24,
    gap: 4,
  },
  assistantCard: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
