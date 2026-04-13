import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap } from 'lucide-react-native';
import { getColors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useApp } from '../../contexts/AppContext';

const TOAST_DURATION_MS = 1500;

type VisibleToast = {
  amount: number;
  id: number;
};

export function GlobalXpToast() {
  const { theme, uiLanguage, recentXpGain } = useApp();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const previousToastIdRef = useRef<number | null>(null);
  const [visibleToast, setVisibleToast] = useState<VisibleToast | null>(null);

  useEffect(() => {
    if (!recentXpGain) {
      return;
    }

    if (recentXpGain.id === previousToastIdRef.current) {
      return;
    }

    previousToastIdRef.current = recentXpGain.id;
    setVisibleToast(recentXpGain);
    opacity.stopAnimation();
    translateY.stopAnimation();
    scale.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(-10);
    scale.setValue(0.96);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    const timeoutId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisibleToast((current) => (current?.id === recentXpGain.id ? null : current));
      });
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [opacity, recentXpGain, scale, translateY]);

  if (!visibleToast) {
    return null;
  }

  const subtitle = t(uiLanguage, 'xpEarned');

  return (
    <View style={[styles.overlay, styles.pointerEventsNone]}>
      <Animated.View
        style={[
          styles.toast,
          {
            top: insets.top + 14,
            backgroundColor: colors.cardBackground,
            borderColor: colors.success + '30',
            shadowColor: colors.text,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.success + '16' }]}>
          <Zap color={colors.success} size={14} strokeWidth={2.4} />
        </View>
        <View>
          <Text style={[styles.amount, { color: colors.text }]}>+{visibleToast.amount} XP</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
