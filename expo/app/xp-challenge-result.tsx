import { useCallback, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import ViewShot from '../src/shims/react-native-view-shot';
import { useApp } from '../contexts/AppContext';
import { getColors } from '../constants/colors';
import { t } from '../constants/translations';
import { sharePngImage } from '../src/utils/shareImage';
import { formatXpChallengeDuration, loadLastXpChallengeResult, markXpChallengeResultAsSeen, type FinishedXpChallenge } from '../src/features/xpChallenge';

const appLogo = require('../assets/images/icon.png');

function getWinnerName(result: FinishedXpChallenge, uiLanguage: string): string {
  if (result.winner === 'challenger') {
    return result.challenger.username ?? t(uiLanguage, 'xpChallengeYou');
  }

  if (result.winner === 'opponent') {
    return result.opponent.username ?? t(uiLanguage, 'xpChallengeYou');
  }

  return t(uiLanguage, 'xpChallengeTieSummary');
}

export default function XpChallengeResultScreen() {
  const { uiLanguage, theme } = useApp();
  const colors = getColors(theme);
  const durationLabels = {
    dayShort: t(uiLanguage, 'dayShort'),
    hourShort: t(uiLanguage, 'hourShort'),
    minuteShort: t(uiLanguage, 'minuteShort'),
  };
  const router = useRouter();
  const shareCardRef = useRef<ViewShot>(null);
  const [result, setResult] = useState<FinishedXpChallenge | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadResult = async () => {
        const stored = await loadLastXpChallengeResult();
        if (stored) {
          await markXpChallengeResultAsSeen(stored);
        }
        if (mounted) {
          setResult(stored);
        }
      };

      void loadResult();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleShare = async () => {
    if (!result || isSharing) {
      return;
    }

    try {
      setIsSharing(true);
      const uri = await shareCardRef.current?.capture?.({ format: 'png', quality: 1 });

      if (!uri) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableGenerate'));
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableDevice'));
        return;
      }

      await sharePngImage(uri, t(uiLanguage, 'xpChallengeShareDialogTitle'));
    } catch {
      Alert.alert(t(uiLanguage, 'shareErrorTitle'), t(uiLanguage, 'shareErrorGeneric'));
    } finally {
      setIsSharing(false);
    }
  };

  if (!result) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(uiLanguage, 'xpChallengeNoResult')}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>{t(uiLanguage, 'back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const winnerName = getWinnerName(result, uiLanguage);
  const isTie = result.winner === 'tie';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <View style={[styles.brandPill, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}> 
            <Image source={appLogo} style={styles.brandIcon} resizeMode="cover" />
            <Text style={[styles.brandText, { color: colors.text }]}>Bible Verse Memo</Text>
          </View>

          <Text style={styles.heroCrown}>{isTie ? '🤝' : '👑'}</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {isTie ? t(uiLanguage, 'xpChallengeTieTitle') : t(uiLanguage, 'xpChallengeWinnerTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isTie ? t(uiLanguage, 'xpChallengeTieSubtitle') : `${winnerName} ${t(uiLanguage, 'xpChallengeWinsSuffix')}`}
          </Text>

          <View style={styles.duelGrid}>
            <View style={[styles.playerPanel, { borderColor: colors.border, backgroundColor: colors.background }]}> 
              <Text style={[styles.playerName, { color: colors.text }]}>{result.challenger.username}</Text>
              <Text style={[styles.playerVerses, { color: colors.primary }]}>{result.challengerVerseGain}</Text>
              <Text style={[styles.playerLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpChallengeVersesCompletedDuring')}</Text>
              <Text style={[styles.playerXp, { color: colors.success }]}>+{result.challengerXpGain} XP</Text>
            </View>

            <View style={[styles.playerPanel, { borderColor: colors.border, backgroundColor: colors.background }]}> 
              <Text style={[styles.playerName, { color: colors.text }]}>{result.opponent.username}</Text>
              <Text style={[styles.playerVerses, { color: colors.primary }]}>{result.opponentVerseGain}</Text>
              <Text style={[styles.playerLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpChallengeVersesCompletedDuring')}</Text>
              <Text style={[styles.playerXp, { color: colors.success }]}>+{result.opponentXpGain} XP</Text>
            </View>
          </View>

          <View style={[styles.summaryBox, { borderColor: colors.border, backgroundColor: colors.background }]}> 
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {t(uiLanguage, 'xpChallengeSummaryPrefix')} {formatXpChallengeDuration(result.durationMinutes, durationLabels)}
            </Text>
            <Text style={[styles.summaryWinner, { color: colors.text }]}>
              {isTie ? t(uiLanguage, 'xpChallengeTieSummary') : `${winnerName} 👑`}
            </Text>
            {!isTie ? (
              <View style={[styles.bonusBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}> 
                <Text style={[styles.bonusTitle, { color: colors.primary }]}>{t(uiLanguage, 'xpChallengeWinnerBonusTitle')}</Text>
                <Text style={[styles.bonusText, { color: colors.textSecondary }]}>
                  {t(uiLanguage, 'xpChallengeWinnerBonusBody')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.hiddenCaptureContainer, styles.pointerEventsNone]}>
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }} style={[styles.captureRoot, { backgroundColor: colors.background }]}> 
          <View style={[styles.captureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Image source={appLogo} style={styles.captureLogo} resizeMode="cover" />
            <Text style={[styles.captureHeadline, { color: colors.text }]}>Bible Verse Memo</Text>
            <Text style={[styles.captureSubheadline, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpChallengeShareHeadline')}</Text>
            <Text style={[styles.captureWinnerLine, { color: colors.text }]}>{isTie ? t(uiLanguage, 'xpChallengeTieSummary') : `${winnerName} 👑`}</Text>

            <View style={styles.captureScoreRow}>
              <View style={[styles.captureScoreCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                <Text style={[styles.capturePlayerName, { color: colors.text }]}>{result.challenger.username}</Text>
                <Text style={[styles.captureVerses, { color: colors.primary }]}>{result.challengerVerseGain}</Text>
                <Text style={[styles.captureMeta, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpChallengeShareVerses')}</Text>
                <Text style={[styles.captureXp, { color: colors.success }]}>+{result.challengerXpGain} XP</Text>
              </View>

              <View style={[styles.captureScoreCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                <Text style={[styles.capturePlayerName, { color: colors.text }]}>{result.opponent.username}</Text>
                <Text style={[styles.captureVerses, { color: colors.primary }]}>{result.opponentVerseGain}</Text>
                <Text style={[styles.captureMeta, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpChallengeShareVerses')}</Text>
                <Text style={[styles.captureXp, { color: colors.success }]}>+{result.opponentXpGain} XP</Text>
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

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.replace('/(tabs)/progress' as any)}>
          <Text style={styles.primaryButtonText}>{t(uiLanguage, 'continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 140,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  heroCrown: {
    fontSize: 54,
  },
  title: {
    fontSize: 30,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  duelGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  playerPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  playerVerses: {
    fontSize: 40,
    fontWeight: '900' as const,
  },
  playerLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  playerXp: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  summaryBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    textAlign: 'center',
  },
  summaryWinner: {
    fontSize: 22,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  bonusBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  bonusText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  hiddenCaptureContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  captureRoot: {
    width: 1080,
    height: 1350,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 72,
  },
  captureCard: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 42,
    paddingHorizontal: 56,
    paddingVertical: 72,
    alignItems: 'center',
    gap: 24,
  },
  captureLogo: {
    width: 176,
    height: 176,
    borderRadius: 38,
  },
  captureHeadline: {
    fontSize: 64,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  captureSubheadline: {
    fontSize: 32,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 42,
  },
  captureWinnerLine: {
    fontSize: 42,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  captureScoreRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 24,
  },
  captureScoreCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  capturePlayerName: {
    fontSize: 32,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  captureVerses: {
    fontSize: 64,
    fontWeight: '900' as const,
  },
  captureMeta: {
    fontSize: 22,
    textAlign: 'center',
  },
  captureXp: {
    fontSize: 34,
    fontWeight: '900' as const,
  },
  actionsRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  emptyTitle: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 24,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
