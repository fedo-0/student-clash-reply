import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { type CourseScoreSummary } from '@/utils/score-calculator';

interface ScoreGaugeProps {
  summary: CourseScoreSummary;
}

const TOTAL_SEGMENTS = 64;
const TICK_COUNT = 9;
const SPARKLE_POSITIONS = [
  { angle: -42, radiusFactor: 0.78, size: 3.5 },
  { angle: -28, radiusFactor: 0.85, size: 2.5 },
  { angle: -18, radiusFactor: 0.72, size: 3 },
  { angle: -8, radiusFactor: 0.84, size: 3.5 },
  { angle: 4, radiusFactor: 0.76, size: 2.5 },
  { angle: 12, radiusFactor: 0.86, size: 3.5 },
  { angle: 19, radiusFactor: 0.74, size: 3 },
  { angle: 26, radiusFactor: 0.82, size: 3.5 },
  { angle: 34, radiusFactor: 0.77, size: 2.5 },
];

export function ScoreGauge({ summary }: ScoreGaugeProps) {
  const isDark = useColorScheme() === 'dark';

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const needleColor = isDark ? '#F8FAFC' : '#1E293B';
  const dividerColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const insightBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(15, 23, 42, 0.04)';

  const clampedScore = Math.max(0, Math.min(100, summary.score));
  // Angle from -90 deg (left, score 0) to +90 deg (right, score 100)
  const needleAngle = -90 + (clampedScore / 100) * 180;
  const activeSegmentThreshold = Math.round(
    (clampedScore / 100) * (TOTAL_SEGMENTS - 1)
  );

  const outerRadius = 122;
  const innerRadius = 74;
  const bandThickness = outerRadius - innerRadius;

  return (
    <LiquidGlassCard style={styles.card}>
      <View style={styles.gaugeWrapper}>
        <View style={styles.arcStage}>
          {/* Semicircular soft blue gradient band */}
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, index) => {
            const fraction = index / (TOTAL_SEGMENTS - 1);
            const deg = -90 + fraction * 180;
            const isFilled = index <= activeSegmentThreshold;
            const edgeFade = Math.sin(fraction * Math.PI);

            const bgColor = isFilled
              ? isDark
                ? `rgba(56, 189, 248, ${(0.22 + 0.65 * edgeFade).toFixed(2)})`
                : `rgba(86, 192, 252, ${(0.26 + 0.70 * edgeFade).toFixed(2)})`
              : isDark
                ? `rgba(255, 255, 255, ${(0.04 + 0.08 * edgeFade).toFixed(2)})`
                : `rgba(186, 230, 253, ${(0.14 + 0.34 * edgeFade).toFixed(2)})`;

            return (
              <View
                key={`seg-${index}`}
                style={[
                  styles.rayContainer,
                  {
                    transform: [{ rotate: `${deg}deg` }],
                  },
                ]}>
                <View
                  style={[
                    styles.raySegment,
                    {
                      height: bandThickness,
                      backgroundColor: bgColor,
                    },
                  ]}
                />
              </View>
            );
          })}

          {/* Subtle sparkle dots inside the active blue band */}
          {SPARKLE_POSITIONS.map((dot, idx) => {
            if (dot.angle > needleAngle - 2) return null;
            const rad = ((dot.angle - 90) * Math.PI) / 180;
            const r = outerRadius * dot.radiusFactor;
            const cx = outerRadius + r * Math.cos(rad);
            const cy = outerRadius + r * Math.sin(rad);
            return (
              <View
                key={`dot-${idx}`}
                style={{
                  position: 'absolute',
                  left: cx - dot.size / 2,
                  top: cy - dot.size / 2,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                }}
              />
            );
          })}

          {/* Inner tick marks along the inner arc */}
          {Array.from({ length: TICK_COUNT }).map((_, index) => {
            const fraction = index / (TICK_COUNT - 1);
            const deg = -76 + fraction * 152;
            const isPast = deg <= needleAngle;
            return (
              <View
                key={`tick-${index}`}
                style={[
                  styles.tickRay,
                  {
                    transform: [{ rotate: `${deg}deg` }],
                  },
                ]}>
                <View
                  style={[
                    styles.tickMark,
                    {
                      backgroundColor: isPast
                        ? isDark
                          ? 'rgba(241, 245, 249, 0.65)'
                          : 'rgba(51, 65, 85, 0.45)'
                        : isDark
                          ? 'rgba(255, 255, 255, 0.20)'
                          : 'rgba(148, 163, 184, 0.35)',
                    },
                  ]}
                />
              </View>
            );
          })}

          {/* Needle */}
          <View
            style={[
              styles.needleRay,
              {
                transform: [{ rotate: `${needleAngle}deg` }],
              },
            ]}>
            <View
              style={[
                styles.needleTip,
                {
                  backgroundColor: needleColor,
                  height: bandThickness - 10,
                },
              ]}
            />
          </View>
        </View>

        {/* Score & Status text centered under the arch */}
        <View style={styles.scoreTextBlock}>
          <Text style={[styles.scoreNumber, { color: textPrimary }]}>
            {clampedScore}
          </Text>
          <Text style={[styles.statusLabel, { color: textPrimary }]}>
            {summary.statusLabel}
          </Text>
          <Text style={[styles.subtitleText, { color: textSecondary }]}>
            {summary.subtitle}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* AI Insight Box */}
      <View style={[styles.insightBox, { backgroundColor: insightBg }]}>
        <View style={styles.insightHeaderRow}>
          <Text style={[styles.insightTitle, { color: textPrimary }]}>
            AI Insight
          </Text>
        </View>

        <View style={styles.insightBullets}>
          <View style={styles.insightItem}>
            <View
              style={[styles.dotIndicator, { backgroundColor: '#10B981' }]}
            />
            <Text style={[styles.insightLine, { color: textSecondary }]}>
              <Text style={[styles.insightLabelBold, { color: textPrimary }]}>
                Strongest topic:{' '}
              </Text>
              {summary.strongTopic}
            </Text>
          </View>

          <View style={styles.insightItem}>
            <View
              style={[
                styles.dotIndicator,
                { backgroundColor: isDark ? '#38BDF8' : '#007AFF' },
              ]}
            />
            <Text style={[styles.insightLine, { color: textSecondary }]}>
              <Text style={[styles.insightLabelBold, { color: textPrimary }]}>
                Review next:{' '}
              </Text>
              {summary.weakTopic}
            </Text>
          </View>
        </View>
      </View>
    </LiquidGlassCard>
  );
}

const OUTER_RADIUS = 122;

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  gaugeWrapper: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  arcStage: {
    width: OUTER_RADIUS * 2,
    height: OUTER_RADIUS + 18,
    overflow: 'hidden',
    alignItems: 'center',
  },
  rayContainer: {
    position: 'absolute',
    top: 0,
    left: OUTER_RADIUS - 4.5,
    width: 9,
    height: OUTER_RADIUS * 2,
    alignItems: 'center',
  },
  raySegment: {
    width: 8,
    borderRadius: 4,
  },
  tickRay: {
    position: 'absolute',
    top: 0,
    left: OUTER_RADIUS - 1,
    width: 2,
    height: OUTER_RADIUS * 2,
    alignItems: 'center',
  },
  tickMark: {
    marginTop: 40,
    width: 2,
    height: 7,
    borderRadius: 1,
  },
  needleRay: {
    position: 'absolute',
    top: 0,
    left: OUTER_RADIUS - 2,
    width: 4,
    height: OUTER_RADIUS * 2,
    alignItems: 'center',
    zIndex: 10,
  },
  needleTip: {
    marginTop: 14,
    width: 3.5,
    borderRadius: 2,
  },
  scoreTextBlock: {
    marginTop: -62,
    alignItems: 'center',
    zIndex: 20,
    gap: 4,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: -1,
  },
  statusLabel: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  insightBox: {
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 14,
    gap: 10,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  insightDisclaimer: {
    fontSize: 11,
    fontWeight: '500',
  },
  insightBullets: {
    gap: 6,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  insightLine: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  insightLabelBold: {
    fontWeight: '600',
  },
});
