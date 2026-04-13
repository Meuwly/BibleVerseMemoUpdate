import { useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from '../src/shims/react-native-view-shot';
import { sharePngImage } from '../src/utils/shareImage';
import { useApp } from '../contexts/AppContext';
import { getColors } from '../constants/colors';
import { getLanguageFromBibleVersion, t } from '../constants/translations';
import * as Sharing from 'expo-sharing';

const appLogo = require('../assets/images/icon.png');

export default function XpSuccessScreen() {
  const router = useRouter();
  const { xp } = useLocalSearchParams<{ xp?: string }>();
  const { theme, uiLanguage } = useApp();
  const colors = getColors(theme);
  const xpParam = Array.isArray(xp) ? xp[0] : xp;
  const xpTotal = Number.isFinite(Number(xpParam)) ? Math.max(0, Number(xpParam)) : 0;
  const currentLevel = Math.floor(Math.sqrt(xpTotal / 120)) + 1;
  const shareCardRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const languageCode = getLanguageFromBibleVersion(uiLanguage);
  const formattedXpTotal = new Intl.NumberFormat(languageCode === 'fr' ? 'fr-FR' : languageCode).format(xpTotal);
  const formattedLevel = new Intl.NumberFormat(languageCode === 'fr' ? 'fr-FR' : languageCode).format(currentLevel);

  const shareMessageTitle = t(uiLanguage, 'xpShareMessageTitle');
  const shareMessageBody = t(uiLanguage, 'xpShareMessageBody');
  const shareMessageCta = t(uiLanguage, 'xpShareMessageCta');
  const levelLabel = t(uiLanguage, 'xpLevelLabel');

  const handleShare = async () => {
    if (isSharing) {
      return;
    }

    try {
      setIsSharing(true);
      const uri = await shareCardRef.current?.capture?.({ format: 'png', quality: 1, result: 'tmpfile' });
      if (!uri) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableGenerate'));
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableDevice'));
        return;
      }

      await sharePngImage(uri, t(uiLanguage, 'xpSuccessShareDialogTitle'));
    } catch (error) {
      console.error('Error sharing xp card:', error);
      Alert.alert(t(uiLanguage, 'shareErrorTitle'), t(uiLanguage, 'shareErrorGeneric'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.shareCardCapture, { backgroundColor: colors.background }]}>
        <View style={[styles.sharePreviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.text }]}>
          <View style={[styles.brandPill, { backgroundColor: colors.success + '12', borderColor: colors.success + '35' }]}>
            <Image source={appLogo} style={styles.brandIcon} resizeMode="cover" />
            <Text style={[styles.brandName, { color: colors.text }]}>Bible Verse Memo</Text>
          </View>

          <Text style={[styles.shareHeadline, { color: colors.text }]}>Bible Verse Memo</Text>
          <Text style={[styles.shareBody, { color: colors.textSecondary }]}>{shareMessageTitle}</Text>
          <Text style={[styles.shareBody, styles.shareBodyTight, { color: colors.textSecondary }]}>{shareMessageBody}</Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{levelLabel}</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{formattedLevel}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '25' }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>XP</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>{formattedXpTotal}</Text>
            </View>
          </View>

          <View style={[styles.ctaBlock, { borderTopColor: colors.border }]}>
            <Text style={[styles.shareCta, { color: colors.text }]}>{shareMessageCta}</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statPill, { backgroundColor: colors.success + '12', borderColor: colors.success + '35' }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpTotal')}</Text>
                <Text style={[styles.shareXpValue, { color: colors.success }]}>{formattedXpTotal} XP</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpLevelLabel')}</Text>
                <Text style={[styles.shareLevelValue, { color: colors.primary }]}>{formattedLevel}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.hiddenCaptureContainer, styles.pointerEventsNone]}>
        <ViewShot
          ref={shareCardRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={[styles.shareShotRoot, { backgroundColor: colors.background }]}
        >
          <View style={[styles.shareShotCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Image source={appLogo} style={styles.captureLogo} resizeMode="cover" />
            <Text style={[styles.captureHeadline, { color: colors.text }]}>Bible Verse Memo</Text>
            <Text style={[styles.captureBody, { color: colors.textSecondary }]}>{shareMessageTitle}</Text>
            <Text style={[styles.captureBody, styles.captureBodyTight, { color: colors.textSecondary }]}>{shareMessageBody}</Text>

            <View style={styles.captureMetricsRow}>
              <View style={[styles.captureMetricCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '28' }]}>
                <Text style={[styles.captureMetricLabel, { color: colors.textSecondary }]}>{levelLabel}</Text>
                <Text style={[styles.captureMetricValue, { color: colors.primary }]}>{formattedLevel}</Text>
              </View>
              <View style={[styles.captureMetricCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
                <Text style={[styles.captureMetricLabel, { color: colors.textSecondary }]}>XP</Text>
                <Text style={[styles.captureMetricValue, { color: colors.success }]}>{formattedXpTotal}</Text>
              </View>
            </View>

            <View style={[styles.captureScoreBlock, { backgroundColor: colors.success + '10', borderColor: colors.success + '30' }]}>
              <Text style={[styles.captureCta, { color: colors.text }]}>{shareMessageCta}</Text>
              <View style={styles.captureStatsRow}>
                <View style={[styles.captureStatCard, { backgroundColor: colors.success + '10', borderColor: colors.success + '26' }]}>
                  <Text style={[styles.captureStatLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpTotal')}</Text>
                  <Text style={[styles.captureXpValue, { color: colors.success }]}>{formattedXpTotal} XP</Text>
                </View>
                <View style={[styles.captureStatCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '26' }]}>
                  <Text style={[styles.captureStatLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpLevelLabel')}</Text>
                  <Text style={[styles.captureLevelValue, { color: colors.primary }]}>{formattedLevel}</Text>
                </View>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.primary }]}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{isSharing ? t(uiLanguage, 'sharePreparing') : t(uiLanguage, 'share')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>{t(uiLanguage, 'continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  shareCardCapture: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePreviewCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 14,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 6,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
  },
  shareHeadline: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
  },
  shareBody: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
    maxWidth: 340,
  },
  shareBodyTight: {
    marginTop: -8,
  },
  metricsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  ctaBlock: {
    width: '100%',
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  shareCta: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  shareXpValue: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  shareLevelValue: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  hiddenCaptureContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  shareShotRoot: {
    width: 1080,
    height: 1350,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 72,
  },
  shareShotCard: {
    width: '100%',
    borderRadius: 44,
    borderWidth: 2,
    paddingHorizontal: 72,
    paddingVertical: 88,
    alignItems: 'center',
  },
  captureLogo: {
    width: 180,
    height: 180,
    borderRadius: 40,
    marginBottom: 32,
  },
  captureHeadline: {
    fontSize: 68,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 78,
    marginBottom: 30,
  },
  captureBody: {
    fontSize: 42,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 58,
    maxWidth: 820,
  },
  captureBodyTight: {
    marginTop: 2,
  },
  captureMetricsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    marginBottom: 8,
  },
  captureMetricCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  captureMetricLabel: {
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  captureMetricValue: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
  },
  captureScoreBlock: {
    marginTop: 52,
    width: '100%',
    borderWidth: 2,
    borderRadius: 32,
    paddingHorizontal: 36,
    paddingVertical: 34,
    alignItems: 'center',
    gap: 18,
  },
  captureStatsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 24,
  },
  captureStatCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureStatLabel: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  captureCta: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 54,
  },
  captureXpValue: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 64,
  },
  captureLevelValue: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 80,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
