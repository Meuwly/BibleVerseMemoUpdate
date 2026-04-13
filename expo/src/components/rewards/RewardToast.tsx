import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const CELEBRATION_PARTICLES = [
  { emoji: '✨', x: -74, y: -70, delay: 0 },
  { emoji: '🎉', x: -38, y: -92, delay: 40 },
  { emoji: '⭐', x: 0, y: -108, delay: 80 },
  { emoji: '💛', x: 38, y: -92, delay: 120 },
  { emoji: '🙌', x: 74, y: -70, delay: 160 },
  { emoji: '✨', x: -56, y: -38, delay: 200 },
  { emoji: '🎊', x: 56, y: -38, delay: 240 },
];

interface RewardToastProps {
  message: string;
  detailLines: string[];
  onHide: () => void;
  color: string;
  backgroundColor: string;
  haptic: boolean;
  animation: 'fade' | 'scale' | 'rocket';
  durationMs?: number;
}

export function RewardToast({ message, detailLines, onHide, color, backgroundColor, haptic, animation, durationMs = 2000 }: RewardToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const rocketOpacity = useRef(new Animated.Value(0)).current;
  const rocketTranslateY = useRef(new Animated.Value(8)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.85)).current;
  const sparkleProgress = useRef(CELEBRATION_PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    sparkleProgress.forEach((value) => value.setValue(0));

    const entryAnimations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ];

    if (animation === 'scale' || animation === 'rocket') {
      entryAnimations.push(
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        })
      );
    }

    if (animation === 'rocket') {
      entryAnimations.push(
        Animated.parallel([
          Animated.timing(rocketOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rocketTranslateY, {
            toValue: -24,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    }

    if (animation === 'scale' || animation === 'rocket') {
      entryAnimations.push(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(celebrationOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(pulseScale, {
              toValue: 1,
              friction: 6,
              tension: 130,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(celebrationOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );

      entryAnimations.push(
        Animated.stagger(
          35,
          sparkleProgress.map((spark, index) =>
            Animated.sequence([
              Animated.delay(CELEBRATION_PARTICLES[index].delay),
              Animated.timing(spark, {
                toValue: 1,
                duration: 540,
                useNativeDriver: true,
              }),
            ])
          )
        )
      );
    }

    Animated.parallel(entryAnimations).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rocketOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [
    animation,
    celebrationOpacity,
    durationMs,
    haptic,
    onHide,
    opacity,
    pulseScale,
    rocketOpacity,
    rocketTranslateY,
    scale,
    sparkleProgress,
    translateY,
  ]);

  return (
    <View style={[styles.overlayRoot, styles.pointerEventsBoxNone]}>
      {animation === 'rocket' ? (
        <Animated.View
          style={[
            styles.pointerEventsNone,
            styles.rocketOverlay,
            {
              opacity: rocketOpacity,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.rocket,
              {
                color,
                transform: [{ translateY: rocketTranslateY }],
              },
            ]}
          >
            🚀
          </Animated.Text>
        </Animated.View>
      ) : null}
      {(animation === 'rocket' || animation === 'scale') ? (
        <Animated.View
          style={[
            styles.pointerEventsNone,
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        >
          {CELEBRATION_PARTICLES.map((particle, index) => {
            const particleProgress = sparkleProgress[index];
            return (
              <Animated.Text
                key={`${particle.emoji}-${index}`}
                style={[
                  styles.sparkle,
                  {
                    transform: [
                      {
                        translateX: particleProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, particle.x],
                        }),
                      },
                      {
                        translateY: particleProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, particle.y],
                        }),
                      },
                      {
                        scale: particleProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1.2],
                        }),
                      },
                    ],
                    opacity: particleProgress.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                {particle.emoji}
              </Animated.Text>
            );
          })}
        </Animated.View>
      ) : null}
      <Animated.View
        style={[
          styles.pointerEventsNone,
          styles.toastContainer,
          {
            opacity,
            transform: [{ translateY }, { scale: animation === 'scale' || animation === 'rocket' ? scale : 1 }],
          },
        ]}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor,
            },
          ]}
        >
          <Text style={[styles.message, { color }]}>{message}</Text>
          {detailLines.map((line, index) => (
            <Text key={`${line}-${index}`} style={[styles.detail, { color }]}>
              {line}
            </Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    gap: 4,
    overflow: 'visible',
  },
  rocketOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 21,
  },
  rocket: {
    fontSize: 64,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 22,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 30,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
});
