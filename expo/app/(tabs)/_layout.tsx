import { Tabs, useRouter, useSegments } from "expo-router";
import {
  BookOpen,
  Flame,
  Heart,
  HelpCircle,
  Settings,
  TrendingUp,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "../../constants/colors";
import { t } from "../../constants/translations";
import { useApp } from "../../contexts/AppContext";
import { XpTopBadge } from "../../src/components/XpTopBadge";

const formatRemaining = (ms: number) => {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}:${`${seconds}`.padStart(2, "0")}`;
};

const getEndOfDay = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

export default function TabLayout() {
  const { uiLanguage, theme, streakProgress, streakLossEventId, xpProgress } = useApp();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const [showStreakTimer, setShowStreakTimer] = useState(false);
  const [showStreakLossMessage, setShowStreakLossMessage] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getEndOfDay() - Date.now());

  const previousXpRef = useRef(xpProgress.totalXp);
  const previousStreakRef = useRef(streakProgress.currentStreak);
  const isFirstRenderRef = useRef(true);
  const previousStreakLossEventIdRef = useRef(streakLossEventId);

  const streakPulse = useRef(new Animated.Value(0)).current;
  const streakLossShake = useRef(new Animated.Value(0)).current;
  const streakLossFlash = useRef(new Animated.Value(0)).current;

  const streakLossTranslateX = streakLossShake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -4, 4, -3, 3, 0],
  });

  const particleOffsets = useMemo(
    () => [
      { x: -34, y: -36 },
      { x: -12, y: -46 },
      { x: 10, y: -50 },
      { x: 32, y: -36 },
      { x: -22, y: -20 },
      { x: 22, y: -20 },
    ],
    [],
  );

  const triggerStreakCelebration = useCallback(() => {
    streakPulse.setValue(0);
    Animated.sequence([
      Animated.timing(streakPulse, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(streakPulse, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [streakPulse]);

  const triggerStreakLossAnimation = useCallback(() => {
    setShowStreakLossMessage(true);
    streakLossShake.setValue(0);
    streakLossFlash.setValue(0);

    Animated.parallel([
      Animated.timing(streakLossShake, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(streakLossFlash, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(streakLossFlash, {
          toValue: 0,
          duration: 460,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [streakLossFlash, streakLossShake]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousXpRef.current = xpProgress.totalXp;
      previousStreakRef.current = streakProgress.currentStreak;
      return;
    }

    if (streakProgress.currentStreak > previousStreakRef.current) {
      triggerStreakCelebration();
    }

    if (streakProgress.currentStreak < previousStreakRef.current) {
      triggerStreakLossAnimation();
    }

    if (streakLossEventId > previousStreakLossEventIdRef.current) {
      triggerStreakLossAnimation();
    }

    previousXpRef.current = xpProgress.totalXp;
    previousStreakRef.current = streakProgress.currentStreak;
    previousStreakLossEventIdRef.current = streakLossEventId;
  }, [
    streakLossEventId,
    streakProgress.currentStreak,
    triggerStreakCelebration,
    triggerStreakLossAnimation,
    xpProgress.totalXp,
  ]);

  useEffect(() => {
    if (!showStreakLossMessage) {
      return;
    }

    const timeoutId = setTimeout(() => setShowStreakLossMessage(false), 9500);
    return () => clearTimeout(timeoutId);
  }, [showStreakLossMessage]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeRemaining(getEndOfDay() - Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const currentTab = segments[segments.length - 1];
  const currentScreenKey = segments.join('/');
  const isBookNavigationScreen = currentScreenKey.includes('book');
  const isBooksHomeScreen = currentScreenKey === '(tabs)' || currentTab === 'index';
  const isChapterMenuScreen = currentScreenKey === '(tabs)/book';
  const isSettingsScreen = currentTab === 'settings';
  const shouldShowXpAndStreak = (segments.includes('(tabs)') || Boolean(currentTab)) && !isChapterMenuScreen && !isSettingsScreen;
  const shouldShowTopBadge = shouldShowXpAndStreak && currentTab !== 'memorized' && !isBookNavigationScreen && !isBooksHomeScreen;
  const shouldShowFloatingStreakBadge = shouldShowXpAndStreak && !isBooksHomeScreen;

  useEffect(() => {
    if (isSettingsScreen) {
      setShowStreakTimer(false);
    }
  }, [isSettingsScreen]);

  const floatingBarBottom = Math.max(insets.bottom + 10, 18);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            bottom: floatingBarBottom,
            shadowColor: colors.text,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t(uiLanguage, "books"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primary + "18" }]}>
                <BookOpen color={color} size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t(uiLanguage, "progress"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primary + "18" }]}>
                <TrendingUp color={color} size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="memorized"
          options={{
            title: t(uiLanguage, "memorized"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primary + "18" }]}>
                <Heart color={color} size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="themes"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: t(uiLanguage, "quiz"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primary + "18" }]}>
                <HelpCircle color={color} size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t(uiLanguage, "settings"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrap, focused && { backgroundColor: colors.primary + "18" }]}>
                <Settings color={color} size={20} />
              </View>
            ),
          }}
        />
      </Tabs>

      {shouldShowXpAndStreak ? (
        <>
          {shouldShowTopBadge ? (
            <XpTopBadge
              topOffset={12}
              alignment="right"
              verticalPosition="top"
            />
          ) : null}

          <View style={[styles.overlay, styles.pointerEventsBoxNone]}>
            {particleOffsets.map((particle, index) => (
              <Animated.View
                key={`particle-${index}`}
                style={[
                  styles.pointerEventsNone,
                  styles.streakParticle,
                  {
                    backgroundColor: colors.warning,
                    bottom: floatingBarBottom + 74,
                    opacity: streakPulse.interpolate({
                      inputRange: [0, 0.35, 1],
                      outputRange: [0, 1, 0],
                    }),
                    transform: [
                      {
                        translateX: streakPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, particle.x],
                        }),
                      },
                      {
                        translateY: streakPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, particle.y],
                        }),
                      },
                      {
                        scale: streakPulse.interpolate({
                          inputRange: [0, 0.2, 1],
                          outputRange: [0.4, 1.15, 0.75],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}

            {shouldShowFloatingStreakBadge ? (
              <Animated.View style={{ transform: [{ translateX: streakLossTranslateX }] }}>
                <Pressable
                  style={[
                    styles.streakBadge,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      bottom: floatingBarBottom + 72,
                    },
                  ]}
                  onPress={() => setShowStreakTimer((prev) => !prev)}
                >
                  <View style={[styles.streakIconContainer, { backgroundColor: colors.warning + "18" }]}> 
                    <Flame color={colors.warning} size={14} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={[styles.streakValue, { color: colors.text }]}>{streakProgress.currentStreak}</Text>
                    <Text style={[styles.streakCaption, { color: colors.textTertiary }]}>{t(uiLanguage, 'streakShort')}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null}

            <Animated.View
              style={[
                styles.pointerEventsNone,
                styles.streakLossFlash,
                {
                  backgroundColor: colors.error,
                  bottom: floatingBarBottom + 68,
                  opacity: streakLossFlash.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.18],
                  }),
                  transform: [
                    {
                      scale: streakLossFlash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1.25],
                      }),
                    },
                  ],
                },
              ]}
            />

            {showStreakLossMessage ? (
              <View
                style={[
                  styles.streakLossMessage,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.error,
                    bottom: floatingBarBottom + 160,
                  },
                ]}
              >
                <Text style={[styles.streakLossText, { color: colors.text }]}>{t(uiLanguage, "streakLossMessage")}</Text>
              </View>
            ) : null}

            {shouldShowFloatingStreakBadge && showStreakTimer ? (
              <Pressable
                style={[
                  styles.streakTimer,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    bottom: floatingBarBottom + 130,
                  },
                ]}
                onPress={() => router.push("/(tabs)/progress")}
              >
                <Text style={[styles.streakTimerLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'streakTimerLabel')}</Text>
                <Text style={[styles.streakTimerValue, { color: colors.text }]}>{formatRemaining(timeRemaining)}</Text>
                <Text style={[styles.streakTimerHint, { color: colors.textTertiary }]}>{t(uiLanguage, 'streakTimerHint')}</Text>
              </Pressable>
            ) : null}

          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 74,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 18,
  },
  tabBarItem: {
    borderRadius: 18,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  tabIconWrap: {
    width: 38,
    height: 30,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  streakIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  streakCaption: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  streakTimer: {
    position: "absolute",
    right: 20,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 196,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 5,
  },
  streakTimerLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  streakTimerValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  streakTimerHint: {
    fontSize: 10,
  },
  streakLossFlash: {
    position: "absolute",
    right: 12,
    width: 76,
    height: 76,
    borderRadius: 999,
  },
  streakLossMessage: {
    position: "absolute",
    right: 20,
    width: 264,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  streakLossText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  streakParticle: {
    position: "absolute",
    right: 44,
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
