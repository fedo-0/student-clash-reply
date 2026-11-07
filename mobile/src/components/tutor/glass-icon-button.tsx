import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';

import { useTutorColors } from './tutor-colors';

interface GlassIconButtonProps {
  symbol: SFSymbol;
  fallback: string;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  tint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Circular liquid-glass icon button (used for "+" new chat, back, etc.). */
export function GlassIconButton({
  symbol,
  fallback,
  onPress,
  accessibilityLabel,
  size = 40,
  tint,
  disabled,
  style,
}: GlassIconButtonProps) {
  const colors = useTutorColors();
  const color = tint ?? colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}>
      <LiquidGlassCard
        isInteractive
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
        ]}>
        <SymbolView
          name={symbol}
          size={size * 0.45}
          tintColor={color}
          weight="semibold"
          fallback={<Text style={[styles.fallback, { color }]}>{fallback}</Text>}
        />
      </LiquidGlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    fontSize: 20,
    fontWeight: '600',
  },
});
