import { useColorScheme } from 'react-native';

/** Shared palette for tutor screens, aligned with the rest of the app. */
export function useTutorColors() {
  const isDark = useColorScheme() === 'dark';
  return {
    isDark,
    textPrimary: isDark ? '#F5F7FA' : '#0F172A',
    textSecondary: isDark ? 'rgba(235, 235, 245, 0.62)' : 'rgba(15, 23, 42, 0.58)',
    textTertiary: isDark ? 'rgba(235, 235, 245, 0.40)' : 'rgba(15, 23, 42, 0.38)',
    accent: isDark ? '#38BDF8' : '#007AFF',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    chipBackground: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)',
    chipActiveBackground: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(0, 122, 255, 0.12)',
    codeBackground: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    danger: isDark ? '#FF6B6B' : '#E5484D',
  };
}
