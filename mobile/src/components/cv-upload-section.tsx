import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { useProfile } from '@/context/profile-context';

export function CvUploadSection() {
  const isDark = useColorScheme() === 'dark';
  const { uploadedCv, uploadMockCv, replaceMockCv, removeMockCv } =
    useProfile();

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const separatorColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const accentTintBg = isDark
    ? 'rgba(56, 189, 248, 0.16)'
    : 'rgba(0, 122, 255, 0.10)';
  const secondaryBtnBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(15, 23, 42, 0.06)';
  const dangerTintBg = isDark
    ? 'rgba(248, 113, 113, 0.16)'
    : 'rgba(239, 68, 68, 0.10)';
  const dangerColor = isDark ? '#FCA5A5' : '#DC2626';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeader, { color: textSecondary }]}>
        CV & PERSONALIZATION
      </Text>

      <LiquidGlassCard style={styles.card}>
        {!uploadedCv ? (
          <View style={styles.emptyUploadBlock}>
            <View style={styles.emptyTextColumn}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Resume / Curriculum Vitae
              </Text>
              <Text style={[styles.helperText, { color: textSecondary }]}>
                Your CV is used to personalize Opportunities and highlight top
                role matches.
              </Text>
            </View>

            <Pressable
              onPress={uploadMockCv}
              style={({ pressed }) => [
                styles.uploadButton,
                { backgroundColor: accentTintBg },
                pressed && { opacity: 0.72 },
              ]}>
              <SymbolView
                name="arrow.up.doc"
                size={15}
                tintColor={accentColor}
                fallback={
                  <Text style={[styles.fallbackIcon, { color: accentColor }]}>
                    ↑
                  </Text>
                }
              />
              <Text style={[styles.uploadButtonText, { color: accentColor }]}>
                Upload CV
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.uploadedBlock}>
            <View style={styles.fileRow}>
              <View
                style={[styles.fileIconBadge, { backgroundColor: accentTintBg }]}>
                <SymbolView
                  name="doc.text.fill"
                  size={18}
                  tintColor={accentColor}
                  fallback={
                    <Text style={[styles.fallbackIcon, { color: accentColor }]}>
                      📄
                    </Text>
                  }
                />
              </View>

              <View style={styles.fileInfo}>
                <Text
                  numberOfLines={1}
                  style={[styles.fileName, { color: textPrimary }]}>
                  {uploadedCv.fileName}
                </Text>
                <Text style={[styles.fileMeta, { color: textSecondary }]}>
                  {uploadedCv.fileSize} · {uploadedCv.uploadedAt}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={replaceMockCv}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: secondaryBtnBg },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text style={[styles.actionButtonText, { color: textPrimary }]}>
                  Replace
                </Text>
              </Pressable>

              <Pressable
                onPress={removeMockCv}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: dangerTintBg },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text style={[styles.actionButtonText, { color: dangerColor }]}>
                  Remove
                </Text>
              </Pressable>
            </View>

            <View
              style={[styles.divider, { backgroundColor: separatorColor }]}
            />

            <View style={styles.personalizeNoteRow}>
              <SymbolView
                name="sparkles"
                size={13}
                tintColor={accentColor}
                fallback={
                  <Text style={[styles.fallbackIcon, { color: accentColor }]}>
                    ✦
                  </Text>
                }
              />
              <Text style={[styles.helperText, { color: textSecondary }]}>
                Used to personalize Opportunities — top matches are now boosted.
              </Text>
            </View>
          </View>
        )}
      </LiquidGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
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
  emptyUploadBlock: {
    gap: 14,
  },
  emptyTextColumn: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  uploadedBlock: {
    gap: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  personalizeNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fallbackIcon: {
    fontSize: 13,
    fontWeight: '600',
  },
});
