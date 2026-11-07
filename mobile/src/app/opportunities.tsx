import { useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GlassContainer,
  LiquidGlassBackdrop,
  LiquidGlassCard,
} from '@/components/liquid-glass';
import { OpportunityCard } from '@/components/opportunity-card';
import { useProfile } from '@/context/profile-context';
import { type OpportunityType } from '@/data/profiles';

type FilterType = 'all' | OpportunityType;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'internship', label: 'Internship' },
  { value: 'job', label: 'Job' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'career event', label: 'Career Event' },
];

export default function OpportunitiesScreen() {
  const isDark = useColorScheme() === 'dark';
  const { activeProfile, activeProfileId, opportunities, uploadedCv } =
    useProfile();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  useEffect(() => {
    setSelectedFilter('all');
  }, [activeProfileId]);

  const filteredOpportunities =
    selectedFilter === 'all'
      ? opportunities
      : opportunities.filter((item) => item.type === selectedFilter);

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const cvBadgeBg = isDark
    ? 'rgba(56, 189, 248, 0.14)'
    : 'rgba(0, 122, 255, 0.10)';

  return (
    <View style={styles.root}>
      <LiquidGlassBackdrop />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textPrimary }]}>
              Opportunities
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Curated for {activeProfile.course}
              </Text>
              {uploadedCv && (
                <View
                  style={[
                    styles.cvPersonalizedBadge,
                    { backgroundColor: cvBadgeBg },
                  ]}>
                  <SymbolView
                    name="sparkles"
                    size={11}
                    tintColor={accentColor}
                    fallback={
                      <Text
                        style={[styles.sparkleFallback, { color: accentColor }]}>
                        ✦
                      </Text>
                    }
                  />
                  <Text
                    style={[
                      styles.cvPersonalizedText,
                      { color: accentColor },
                    ]}>
                    Personalized with your CV
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              contentInsetAdjustmentBehavior="never"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}>
              <GlassContainer spacing={10} style={styles.filterGlassGroup}>
                {FILTER_OPTIONS.map((option) => {
                  const isSelected = selectedFilter === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSelectedFilter(option.value)}>
                      <LiquidGlassCard
                        isInteractive
                        glassEffectStyle={isSelected ? 'regular' : 'clear'}
                        tintColor={
                          isSelected
                            ? isDark
                              ? 'rgba(56, 189, 248, 0.28)'
                              : 'rgba(0, 122, 255, 0.18)'
                            : undefined
                        }
                        style={[
                          styles.filterPill,
                          isSelected && {
                            backgroundColor: isDark
                              ? 'rgba(56, 189, 248, 0.22)'
                              : 'rgba(0, 122, 255, 0.14)',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.filterPillText,
                            {
                              color: isSelected ? accentColor : textPrimary,
                            },
                          ]}>
                          {option.label}
                        </Text>
                      </LiquidGlassCard>
                    </Pressable>
                  );
                })}
              </GlassContainer>
            </ScrollView>
          </View>

          {filteredOpportunities.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <LiquidGlassCard style={styles.emptyCard}>
                <Text style={[styles.emptyText, { color: textSecondary }]}>
                  Nothing here yet
                </Text>
              </LiquidGlassCard>
            </View>
          ) : (
            <GlassContainer spacing={12} style={styles.listContainer}>
              {filteredOpportunities.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </GlassContainer>
          )}
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
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cvPersonalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  sparkleFallback: {
    fontSize: 10,
    fontWeight: '600',
  },
  cvPersonalizedText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterGlassGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyWrapper: {
    paddingHorizontal: 20,
    paddingTop: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
  },
});
