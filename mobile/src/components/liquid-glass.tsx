import {
  GlassContainer,
  GlassView,
  isLiquidGlassAvailable,
  type GlassStyle,
} from 'expo-glass-effect';
import {
  StyleSheet,
  useColorScheme,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

interface LiquidGlassCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  glassEffectStyle?: GlassStyle;
  isInteractive?: boolean;
  tintColor?: string;
}

export function LiquidGlassCard({
  children,
  style,
  glassEffectStyle = 'regular',
  isInteractive = false,
  tintColor,
  ...rest
}: LiquidGlassCardProps) {
  const isDark = useColorScheme() === 'dark';
  const hasNativeGlass = isLiquidGlassAvailable();
  const flattenedStyle = StyleSheet.flatten(style);
  const borderRadius = flattenedStyle?.borderRadius ?? 24;

  const fallbackStyle: ViewStyle = isDark
    ? styles.fallbackDark
    : styles.fallbackLight;

  return (
    <GlassView
      glassEffectStyle={glassEffectStyle}
      isInteractive={isInteractive}
      tintColor={tintColor}
      style={[
        styles.base,
        { borderRadius },
        !hasNativeGlass && fallbackStyle,
        style,
      ]}
      {...rest}>
      <View
        pointerEvents="none"
        style={[
          styles.specularBorder,
          { borderRadius },
          isDark ? styles.specularBorderDark : styles.specularBorderLight,
        ]}
      />
      {children}
    </GlassView>
  );
}

export function LiquidGlassBackdrop() {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: isDark ? '#0B040A' : '#F6F8F2' },
      ]}>
      <View
        style={[
          styles.orbPrimary,
          {
            backgroundColor: isDark
              ? 'rgba(202, 233, 255, 0.45)'
              : 'rgba(202, 233, 255, 0.55)',
          },
        ]}
      />
      <View
        style={[
          styles.orbSecondary,
          {
            backgroundColor: isDark
              ? 'rgba(186, 85, 145, 0.55)'
              : 'rgba(99, 38, 74, 0.22)',
          },
        ]}
      />
      <View
        style={[
          styles.orbTertiary,
          {
            backgroundColor: isDark
              ? 'rgba(148, 42, 134, 0.55)'
              : 'rgba(61, 11, 55, 0.20)',
          },
        ]}
      />
    </View>
  );
}

export { GlassContainer };

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  fallbackLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    shadowColor: '#001B3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  fallbackDark: {
    backgroundColor: 'rgba(28, 30, 38, 0.65)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 4,
  },
  specularBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  specularBorderLight: {
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  specularBorderDark: {
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  orbPrimary: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  orbSecondary: {
    position: 'absolute',
    top: 240,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orbTertiary: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
});
