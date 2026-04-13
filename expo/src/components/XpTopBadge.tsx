import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Zap } from 'lucide-react-native';
import { getColors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useApp } from '../../contexts/AppContext';

type XpTopBadgeProps = {
  topOffset?: number;
  bottomOffset?: number;
  draggable?: boolean;
  streakCelebrationText?: string | null;
  alignment?: 'center' | 'right' | 'left';
  verticalPosition?: 'top' | 'bottom';
};

type XpInlineBadgeProps = {
  compact?: boolean;
};

const getCurrentLevel = (totalXp: number) => Math.floor(Math.sqrt(totalXp / 120)) + 1;

export function XpInlineBadge({ compact = false }: XpInlineBadgeProps) {
  const { theme, xpProgress, streakProgress, uiLanguage } = useApp();
  const router = useRouter();
  const colors = getColors(theme);
  const currentLevel = getCurrentLevel(xpProgress.totalXp);
  const iconSize = compact ? 12 : 14;

  return (
    <View
      style={[
        styles.inlineBadge,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          paddingHorizontal: compact ? 10 : 12,
          paddingVertical: compact ? 5 : 6,
          gap: compact ? 5 : 6,
        },
      ]}
    >
      <Pressable
        style={styles.inlinePressable}
        onPress={() => router.push({ pathname: '/xp-success', params: { xp: `${xpProgress.totalXp}` } })}
        hitSlop={8}
      >
        <Zap size={iconSize} color={colors.success} strokeWidth={2.4} />
        <Text style={[styles.inlineValue, compact && styles.inlineValueCompact, { color: colors.text }]}>
          {t(uiLanguage, 'levelShort')} {currentLevel}
        </Text>
      </Pressable>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <Pressable
        style={styles.inlinePressable}
        onPress={() => router.push({ pathname: '/streak-success', params: { streak: `${streakProgress.currentStreak}`, expiresAt: `${new Date(new Date().setHours(23, 59, 59, 999)).getTime()}` } })}
        hitSlop={8}
      >
        <Flame size={iconSize} color={colors.warning} strokeWidth={2.4} />
        <Text style={[styles.inlineValue, compact && styles.inlineValueCompact, { color: colors.text }]}>
          {streakProgress.currentStreak}{t(uiLanguage, 'dayShort')}
        </Text>
      </Pressable>
    </View>
  );
}

export function XpTopBadge({
  topOffset = 8,
  bottomOffset = 8,
  draggable = false,
  streakCelebrationText = null,
  alignment = 'right',
  verticalPosition = 'top',
}: XpTopBadgeProps) {
  const { theme, xpProgress, isLoading } = useApp();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const previousXpRef = useRef(xpProgress.totalXp);
  const isFirstRenderRef = useRef(true);
  const pulse = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragStartRef = useRef({ x: 0, y: 0 });
  const badgeSizeRef = useRef({ width: 0, height: 0 });
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousXpRef.current = xpProgress.totalXp;
      return;
    }

    if (xpProgress.totalXp <= previousXpRef.current) {
      previousXpRef.current = xpProgress.totalXp;
      return;
    }

    previousXpRef.current = xpProgress.totalXp;
    pulse.setValue(0);

    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 380,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLoading, pulse, xpProgress.totalXp]);

  useEffect(() => {
    if (!streakCelebrationText) {
      return;
    }

    setShowStreakCelebration(true);
    const timeoutId = setTimeout(() => {
      setShowStreakCelebration(false);
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [streakCelebrationText]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => draggable && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
    onPanResponderGrant: () => {
      drag.stopAnimation((value) => {
        dragStartRef.current = value;
      });
    },
    onPanResponderMove: (_, gestureState) => {
      const horizontalInset = alignment === 'right' ? 16 : 8;
      const maxX = Math.max(window.width - badgeSizeRef.current.width - horizontalInset, 0);
      const minX = alignment === 'right'
        ? -maxX
        : alignment === 'left'
          ? 0
          : -Math.max((window.width - badgeSizeRef.current.width) / 2 - 8, 0);
      const allowedMaxX = alignment === 'right'
        ? 0
        : alignment === 'left'
          ? maxX
          : Math.max((window.width - badgeSizeRef.current.width) / 2 - 8, 0);
      const verticalInset = verticalPosition === 'top'
        ? insets.top + topOffset
        : insets.bottom + bottomOffset;
      const maxY = Math.max(window.height - verticalInset - badgeSizeRef.current.height - (verticalPosition === 'top' ? insets.bottom + 8 : insets.top + 8), 0);
      const nextX = Math.min(Math.max(dragStartRef.current.x + gestureState.dx, minX), allowedMaxX);
      const nextY = Math.min(Math.max(dragStartRef.current.y + gestureState.dy, 0), maxY);
      drag.setValue({ x: nextX, y: nextY });
    },
    onPanResponderRelease: (_, gestureState) => {
      const horizontalInset = alignment === 'right' ? 16 : 8;
      const maxX = Math.max(window.width - badgeSizeRef.current.width - horizontalInset, 0);
      const minX = alignment === 'right'
        ? -maxX
        : alignment === 'left'
          ? 0
          : -Math.max((window.width - badgeSizeRef.current.width) / 2 - 8, 0);
      const allowedMaxX = alignment === 'right'
        ? 0
        : alignment === 'left'
          ? maxX
          : Math.max((window.width - badgeSizeRef.current.width) / 2 - 8, 0);
      const verticalInset = verticalPosition === 'top'
        ? insets.top + topOffset
        : insets.bottom + bottomOffset;
      const maxY = Math.max(window.height - verticalInset - badgeSizeRef.current.height - (verticalPosition === 'top' ? insets.bottom + 8 : insets.top + 8), 0);
      const nextX = Math.min(Math.max(dragStartRef.current.x + gestureState.dx, minX), allowedMaxX);
      const nextY = Math.min(Math.max(dragStartRef.current.y + gestureState.dy, 0), maxY);
      dragStartRef.current = { x: nextX, y: nextY };
      drag.setValue({ x: nextX, y: nextY });
    },
  }), [alignment, bottomOffset, draggable, drag, insets.bottom, insets.top, topOffset, verticalPosition, window.height, window.width]);

  return (
    <View style={[styles.root, styles.pointerEventsBoxNone]}>
      <Animated.View
        style={[
          styles.pointerEventsBoxNone,
          styles.container,
          alignment === 'right' ? styles.containerRight : alignment === 'left' ? styles.containerLeft : styles.containerCenter,
          {
            ...(verticalPosition === 'top'
              ? { top: insets.top + topOffset }
              : { bottom: insets.bottom + bottomOffset }),
            transform: [{ translateX: drag.x }, { translateY: drag.y }],
          },
        ]}
        {...(draggable ? panResponder.panHandlers : {})}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
          }}
        >
          <View
            onLayout={(event) => {
              badgeSizeRef.current = {
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              };
            }}
          >
            <XpInlineBadge />
          </View>
        </Animated.View>
        {showStreakCelebration && streakCelebrationText ? (
          <View style={[styles.streakCelebrationBubble, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '70' }]}> 
            <Text style={[styles.streakCelebrationText, { color: colors.text }]}>{streakCelebrationText}</Text>
          </View>
        ) : null}
        <Animated.View
          style={[
            styles.pointerEventsNone,
            styles.glow,
            {
              backgroundColor: colors.success,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  container: {
    position: 'absolute',
  },
  containerCenter: {
    alignSelf: 'center',
  },
  containerLeft: {
    left: 8,
  },
  containerRight: {
    right: 16,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  inlinePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  inlineValueCompact: {
    fontSize: 12,
  },
  separator: {
    width: 1,
    height: 14,
    marginHorizontal: 6,
    opacity: 0.7,
  },
  streakCelebrationBubble: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: 'flex-end',
    maxWidth: 260,
  },
  streakCelebrationText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    zIndex: -1,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
