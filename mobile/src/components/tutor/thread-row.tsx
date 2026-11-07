import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTutorMode } from '@/data/tutor-modes';
import { type TutorThread } from '@/types/tutor';

import { useTutorColors } from './tutor-colors';

interface ThreadRowProps {
  thread: TutorThread;
  courseName: string | null;
  courseColor: string | null;
  showDivider: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function ThreadRow({
  thread,
  courseName,
  courseColor,
  showDivider,
  onPress,
  onLongPress,
}: ThreadRowProps) {
  const colors = useTutorColors();
  const mode = getTutorMode(thread.mode);
  const lastMessage = [...thread.messages].reverse().find((m) => m.content.length > 0);
  const hasVoice = thread.messages.some((m) => m.viaVoice);
  const preview = lastMessage
    ? lastMessage.content.replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim()
    : 'No messages yet';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: courseColor ? `${courseColor}26` : colors.chipBackground },
        ]}>
        <SymbolView
          name={mode.symbol}
          size={16}
          tintColor={courseColor ?? colors.accent}
          fallback={<Text style={{ color: courseColor ?? colors.accent }}>●</Text>}
        />
      </View>

      <View style={[styles.content, showDivider && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
            {thread.title}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatRelative(thread.updatedAt)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          {hasVoice && (
            <SymbolView
              name="waveform"
              size={11}
              tintColor={colors.textTertiary}
              fallback={<Text style={{ color: colors.textTertiary, fontSize: 11 }}>🎙</Text>}
            />
          )}
          <Text numberOfLines={1} style={[styles.meta, { color: colors.textSecondary }]}>
            {mode.shortLabel}
            {courseName ? ` · ${courseName}` : ''}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.preview, { color: colors.textTertiary }]}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 11,
    paddingRight: 14,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  preview: {
    fontSize: 14,
  },
});
