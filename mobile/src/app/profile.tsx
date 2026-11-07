import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CvUploadSection } from '@/components/cv-upload-section';
import { GraduationGoalSection } from '@/components/graduation-goal-section';
import {
  GlassContainer,
  LiquidGlassBackdrop,
  LiquidGlassCard,
} from '@/components/liquid-glass';
import { useProfile } from '@/context/profile-context';
import { PROFILE_ORDER, PROFILES } from '@/data/profiles';

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const { activeProfile, activeProfileId, setActiveProfileId } = useProfile();

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const separatorColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const chipBg = isDark
    ? 'rgba(56, 189, 248, 0.16)'
    : 'rgba(0, 122, 255, 0.10)';
  const avatarBorder = isDark
    ? 'rgba(255, 255, 255, 0.18)'
    : 'rgba(255, 255, 255, 0.9)';
  const segmentTrackBg = isDark
    ? 'rgba(255, 255, 255, 0.07)'
    : 'rgba(15, 23, 42, 0.06)';
  const segmentActiveBg = isDark
    ? 'rgba(255, 255, 255, 0.18)'
    : 'rgba(255, 255, 255, 0.92)';

  const initials = activeProfile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView
        style={styles.container}
        edges={['top', 'left', 'right']}>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>Profile</Text>
          </View>

          <GlassContainer spacing={20} style={styles.sectionsContainer}>
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: textSecondary }]}>
                STUDENT PROFILE
              </Text>

              <LiquidGlassCard style={styles.card}>
                <View style={styles.identityRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: chipBg, borderColor: avatarBorder },
                    ]}>
                    <Text style={[styles.avatarText, { color: accentColor }]}>
                      {initials}
                    </Text>
                  </View>
                  <View style={styles.identityText}>
                    <Text style={[styles.name, { color: textPrimary }]}>
                      {activeProfile.name}
                    </Text>
                    <Text
                      style={[styles.courseSubtitle, { color: textSecondary }]}>
                      {activeProfile.course}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: separatorColor }]}
                />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>
                    Course
                  </Text>
                  <Text style={[styles.infoValue, { color: textPrimary }]}>
                    {activeProfile.course}
                  </Text>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: separatorColor }]}
                />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>
                    Year of Study
                  </Text>
                  <Text style={[styles.infoValue, { color: textPrimary }]}>
                    {activeProfile.yearOfStudy}
                  </Text>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: separatorColor }]}
                />

                <View style={styles.bioBlock}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>
                    Bio
                  </Text>
                  <Text style={[styles.bioText, { color: textPrimary }]}>
                    {activeProfile.bio}
                  </Text>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: separatorColor }]}
                />

                <View style={styles.interestsBlock}>
                  <Text style={[styles.infoLabel, { color: textSecondary }]}>
                    Interests
                  </Text>
                  <View style={styles.chipsContainer}>
                    {activeProfile.interests.map((interest) => (
                      <View
                        key={interest}
                        style={[styles.chip, { backgroundColor: chipBg }]}>
                        <Text style={[styles.chipText, { color: accentColor }]}>
                          {interest}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LiquidGlassCard>
            </View>

            <GraduationGoalSection />

            <CvUploadSection />

            {__DEV__ && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: textSecondary }]}>
                  DEVELOPER MENU
                </Text>

                <LiquidGlassCard style={styles.card}>
                  <Text style={[styles.devLabel, { color: textPrimary }]}>
                    Active Student Profile
                  </Text>

                  <View
                    style={[
                      styles.segmentedControl,
                      { backgroundColor: segmentTrackBg },
                    ]}>
                    {PROFILE_ORDER.map((profileId) => {
                      const profile = PROFILES[profileId];
                      const isSelected = activeProfileId === profileId;
                      return (
                        <Pressable
                          key={profileId}
                          onPress={() => setActiveProfileId(profileId)}
                          style={[
                            styles.segmentOption,
                            isSelected && [
                              styles.segmentOptionSelected,
                              { backgroundColor: segmentActiveBg },
                            ],
                          ]}>
                          <Text
                            style={[
                              styles.segmentText,
                              { color: textPrimary },
                              isSelected && styles.segmentTextSelected,
                            ]}>
                            {profile.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.devHint, { color: textSecondary }]}>
                    Switching profiles immediately updates the Opportunities
                    tab.
                  </Text>
                </LiquidGlassCard>
              </View>
            )}
          </GlassContainer>
        </ScrollView>
      </SafeAreaView>
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
  scrollContent: {
    paddingBottom: 110,
    gap: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 6,
  },
  card: {
    padding: 18,
    gap: 14,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  identityText: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  courseSubtitle: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  bioBlock: {
    gap: 6,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  interestsBlock: {
    gap: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  devLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  segmentOptionSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextSelected: {
    fontWeight: '600',
  },
  devHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
