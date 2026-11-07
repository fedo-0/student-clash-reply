import { DarkTheme, DefaultTheme, ThemeProvider, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { ProfileProvider } from '@/context/profile-context';
import { TutorProvider } from '@/context/tutor-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  // Hide the tab bar inside an open tutor chat so the composer owns the bottom edge.
  const isInTutorChat = pathname.startsWith('/tutor/');

  return (
    <ProfileProvider>
      <TutorProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <NativeTabs
            hidden={isInTutorChat}
            tintColor={isDark ? '#38BDF8' : '#007AFF'}
            blurEffect="systemUltraThinMaterial"
            minimizeBehavior="onScrollDown"
            iconColor={{
              default: '#8E8E93',
              selected: isDark ? '#38BDF8' : '#007AFF',
            }}
            labelStyle={{
              default: { color: '#8E8E93' },
              selected: { color: isDark ? '#38BDF8' : '#007AFF' },
            }}>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Label>Courses</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf="book" md="book" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="tutor">
              <NativeTabs.Trigger.Label>Tutor</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf="bubble.left" md="chat_bubble_outline" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="opportunities">
              <NativeTabs.Trigger.Label>Opportunities</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf="briefcase" md="work_outline" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
              <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf="person" md="person_outline" />
            </NativeTabs.Trigger>
          </NativeTabs>
        </ThemeProvider>
      </TutorProvider>
    </ProfileProvider>
  );
}
