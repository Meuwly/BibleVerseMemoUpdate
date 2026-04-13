import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MessageSquareDot } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { getColors } from '../../../constants/colors';
import { t } from '../../../constants/translations';
import { useAppSettings } from '../../../contexts/AppContext';
import {
  dismissPoll,
  fetchActivePoll,
  hasDismissedPoll,
  hasVotedOnPoll,
  isPollExpired,
  type FeaturePoll,
} from './pollService';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Shown once per app session when an active, unvoted, non-dismissed poll exists.
 * - "Vote now"        → navigates to Settings tab (session-only hide)
 * - "Don't show again" → calls dismissPoll() and never shows again
 */
export function PollLaunchBanner() {
  const { uiLanguage, theme } = useAppSettings();
  const colors = getColors(theme);
  const router = useRouter();
  const isFrench = uiLanguage.startsWith('fr');

  const [poll, setPoll] = useState<FeaturePoll | null>(null);
  const [visible, setVisible] = useState(false);

  // Slide-up + fade animation
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // ── Load poll on mount ──────────────────────────────────────────────────

  const loadPoll = useCallback(async () => {
    try {
      const activePoll = await fetchActivePoll();
      if (!activePoll) return;

      // Hide expired polls
      if (isPollExpired(activePoll)) return;

      const [voted, dismissed] = await Promise.all([
        hasVotedOnPoll(activePoll.id),
        hasDismissedPoll(activePoll.id),
      ]);

      if (voted || dismissed) return;

      setPoll(activePoll);
      setVisible(true);
    } catch {
      // Silently ignore — banner is non-critical
    }
  }, []);

  useEffect(() => {
    // Small delay so the banner appears after the app is fully rendered
    const timer = setTimeout(() => void loadPoll(), 800);
    return () => clearTimeout(timer);
  }, [loadPoll]);

  // ── Animate in when visible ─────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(60);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, opacity]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const animateOut = useCallback((onDone: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 60,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, [translateY, opacity]);

  const handleVoteNow = useCallback(() => {
    animateOut(() => {
      setVisible(false);
      router.push('/(tabs)/settings' as any);
    });
  }, [animateOut, router]);

  const handleDismiss = useCallback(() => {
    if (!poll) return;
    animateOut(() => {
      setVisible(false);
      void dismissPoll(poll.id);
    });
  }, [animateOut, poll]);

  if (!visible || !poll) return null;

  const title = isFrench ? poll.title_fr : poll.title_en;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Dimmed backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={handleDismiss} />

      {/* Banner card (anchored to bottom) */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.primary + '40',
            shadowColor: colors.text,
            transform: [{ translateY }],
            opacity,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Eyebrow */}
        <View style={styles.eyebrowRow}>
          <MessageSquareDot color={colors.primary} size={15} />
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {t(uiLanguage, 'pollSectionEyebrow')}
          </Text>
        </View>

        {/* Poll title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
          {title}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.voteButton, { backgroundColor: colors.primary }]}
            onPress={handleVoteNow}
            activeOpacity={0.8}
          >
            <Text style={[styles.voteButtonText, { color: colors.background }]}>
              {t(uiLanguage, 'pollBannerVoteNow')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.6}
          >
            <Text style={[styles.dismissText, { color: colors.textTertiary }]}>
              {t(uiLanguage, 'pollBannerNotNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    // Shadow (iOS)
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    // Elevation (Android)
    elevation: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 20,
  },
  actions: {
    gap: 10,
  },
  voteButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 13,
  },
});
