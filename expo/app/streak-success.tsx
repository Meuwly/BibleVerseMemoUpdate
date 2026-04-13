import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import ViewShot from '../src/shims/react-native-view-shot';
import { sharePngImage } from '../src/utils/shareImage';
import { useApp } from '../contexts/AppContext';
import { getColors } from '../constants/colors';
import { t } from '../constants/translations';
import * as Sharing from 'expo-sharing';

const appLogo = require('../assets/images/icon.png');

function getEndOfDayTimestamp() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function formatRemaining(ms: number) {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

export default function StreakSuccessScreen() {
  const router = useRouter();
  const { streak, expiresAt } = useLocalSearchParams<{ streak?: string; expiresAt?: string }>();
  const { theme, uiLanguage } = useApp();
  const colors = getColors(theme);
  const streakParam = Array.isArray(streak) ? streak[0] : streak;
  const expiresAtParam = Array.isArray(expiresAt) ? expiresAt[0] : expiresAt;
  const streakCount = Number.isFinite(Number(streakParam)) ? Math.max(0, Number(streakParam)) : 0;
  const shareCardRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const initialDeadline = Number.isFinite(Number(expiresAtParam)) ? Number(expiresAtParam) : getEndOfDayTimestamp();
  const [timeRemaining, setTimeRemaining] = useState(() => Math.max(initialDeadline - Date.now(), 0));

  useEffect(() => {
    const updateRemaining = () => {
      setTimeRemaining(Math.max(initialDeadline - Date.now(), 0));
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [initialDeadline]);

  const formattedRemaining = useMemo(() => formatRemaining(timeRemaining), [timeRemaining]);

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

      await sharePngImage(uri, t(uiLanguage, 'streakSuccessShareDialogTitle'));
    } catch (error) {
      console.error('Error sharing streak card:', error);
      Alert.alert(t(uiLanguage, 'shareErrorTitle'), t(uiLanguage, 'shareErrorRetry'));
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

      <View style={[styles.previewContainer, { backgroundColor: colors.background }]}> 
        <View style={[styles.previewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.text }]}> 
          <View style={[styles.brandPill, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '35' }]}> 
            <Image source={appLogo} style={styles.brandIcon} resizeMode="cover" />
            <Text style={[styles.brandName, { color: colors.text }]}>Bible Verse Memo</Text>
          </View>

          <View style={[styles.flameBadge, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '35' }]}> 
            <Flame color={colors.warning} size={28} strokeWidth={2.5} />
            <Text style={[styles.flameCount, { color: colors.warning }]}>{streakCount}</Text>
          </View>

          <Text style={[styles.headline, { color: colors.text }]}>{t(uiLanguage, 'streakShareTitle')}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareSubtitle')}</Text>

          <View style={[styles.timerCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '24' }]}> 
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareRemainingLabel')}</Text>
            <Text style={[styles.timerValue, { color: colors.text }]}>{formattedRemaining}</Text>
            <Text style={[styles.timerHint, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareExpiryHint')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.hiddenCaptureContainer, styles.pointerEventsNone]}>
        <ViewShot
          ref={shareCardRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={[styles.captureRoot, { backgroundColor: colors.background }]}
        >
          <View style={[styles.captureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Image source={appLogo} style={styles.captureLogo} resizeMode="cover" />
            <Text style={[styles.captureTitle, { color: colors.text }]}>Bible Verse Memo</Text>
            <Text style={[styles.captureBody, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareImageTitle')}</Text>
            <Text style={[styles.captureBody, styles.captureBodyTight, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareImageBody')}</Text>

            <View style={[styles.captureFlameBlock, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '24' }]}> 
              <View style={styles.captureFlameRow}>
                <Flame color={colors.warning} size={30} strokeWidth={2.5} />
                <Text style={[styles.captureFlameValue, { color: colors.warning }]}>{streakCount} {t(uiLanguage, 'streakSuccessDaysUnit')}</Text>
              </View>
              <Text style={[styles.captureTimerLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakShareRemainingLabel')}</Text>
              <Text style={[styles.captureTimerValue, { color: colors.text }]}>{formattedRemaining}</Text>
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
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 18,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
  },
  flameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  flameCount: {
    fontSize: 34,
    fontWeight: '900',
  },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  timerCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  hiddenCaptureContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  captureRoot: {
    width: 1080,
    padding: 72,
  },
  captureCard: {
    borderRadius: 44,
    borderWidth: 1,
    paddingHorizontal: 56,
    paddingVertical: 60,
    alignItems: 'center',
    gap: 28,
  },
  captureLogo: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
  captureTitle: {
    fontSize: 54,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 62,
  },
  captureBody: {
    fontSize: 34,
    lineHeight: 46,
    textAlign: 'center',
    maxWidth: 760,
  },
  captureBodyTight: {
    marginTop: -10,
  },
  captureFlameBlock: {
    width: '100%',
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  captureFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  captureFlameValue: {
    fontSize: 42,
    fontWeight: '900',
  },
  captureTimerLabel: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  captureTimerValue: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
