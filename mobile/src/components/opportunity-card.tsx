import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { type OpportunityItem, type OpportunityType } from '@/data/profiles';

const TYPE_LABELS: Record<OpportunityType, string> = {
  internship: 'Internship',
  job: 'Job',
  workshop: 'Workshop',
  'career event': 'Career Event',
};

interface OpportunityCardProps {
  item: OpportunityItem;
}

export function OpportunityCard({ item }: OpportunityCardProps) {
  const isDark = useColorScheme() === 'dark';

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const logoBadgeBg = isDark
    ? 'rgba(56, 189, 248, 0.14)'
    : 'rgba(0, 122, 255, 0.08)';
  const typeCapsuleBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(15, 23, 42, 0.045)';
  const typeCapsuleText = isDark
    ? 'rgba(235, 235, 245, 0.68)'
    : 'rgba(15, 23, 42, 0.60)';
  const matchPillBg = isDark
    ? 'rgba(56, 189, 248, 0.12)'
    : 'rgba(0, 122, 255, 0.08)';
  const separatorColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';

  return (
    <LiquidGlassCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.logoBadge, { backgroundColor: logoBadgeBg }]}>
          <Text style={[styles.logoText, { color: accentColor }]}>
            {item.companyInitials}
          </Text>
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.companyRow}>
            <Text
              numberOfLines={1}
              style={[styles.companyName, { color: textSecondary }]}>
              {item.companyName}
            </Text>
            <View
              style={[styles.typeCapsule, { backgroundColor: typeCapsuleBg }]}>
              <Text
                style={[styles.typeCapsuleText, { color: typeCapsuleText }]}>
                {TYPE_LABELS[item.type]}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={2}
            style={[styles.title, { color: textPrimary }]}>
            {item.title}
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={[styles.description, { color: textSecondary }]}>
        {item.description}
      </Text>

      <View style={[styles.divider, { backgroundColor: separatorColor }]} />

      <View style={styles.footerRow}>
        <View style={styles.metaGroup}>
          <View style={styles.metaItem}>
            <SymbolView
              name="mappin.and.ellipse"
              size={11}
              tintColor={textSecondary}
              fallback={
                <Text style={[styles.fallbackIcon, { color: textSecondary }]}>
                  ⌖
                </Text>
              }
            />
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: textSecondary }]}>
              {item.location}
            </Text>
          </View>

          <Text style={[styles.metaDot, { color: textSecondary }]}>·</Text>

          <View style={styles.metaItem}>
            <SymbolView
              name="calendar"
              size={11}
              tintColor={textSecondary}
              fallback={
                <Text style={[styles.fallbackIcon, { color: textSecondary }]}>
                  ◷
                </Text>
              }
            />
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: textSecondary }]}>
              {item.dateOrDeadline}
            </Text>
          </View>
        </View>

        <View style={[styles.matchPill, { backgroundColor: matchPillBg }]}>
          <SymbolView
            name="sparkles"
            size={11}
            tintColor={accentColor}
            fallback={
              <Text style={[styles.sparkleFallback, { color: accentColor }]}>
                ✦
              </Text>
            }
          />
          <Text
            numberOfLines={1}
            style={[styles.matchPillText, { color: accentColor }]}>
            {item.interestTag}
          </Text>
        </View>
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  typeCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeCapsuleText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 5,
    overflow: 'hidden',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    flexShrink: 1,
  },
  fallbackIcon: {
    fontSize: 11,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '400',
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    flexShrink: 0,
  },
  sparkleFallback: {
    fontSize: 10,
    fontWeight: '600',
  },
  matchPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
