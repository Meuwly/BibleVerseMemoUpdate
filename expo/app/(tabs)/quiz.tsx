import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, Sparkles, Swords, Target, Trophy, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useAppProgress, useAppSettings } from '../../contexts/AppContext';
import { useAuthProfileState, useAuthSessionState, useAuthSocialState } from '../../contexts/AuthContext';
import { getColors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { getLocalizedQuizValue, quizCategories, quizQuestions, type QuizCategory } from '../../src/data/quizQuestions';
import { supabase } from '../../src/lib/supabase';
import { fetchLatestQuizChallengeForUser, fetchQuizChallengeById, submitQuizChallengeResult as submitQuizChallengeResultRequest } from '../../src/features/auth/services/quizChallengeService';
import {
  getQuizChallengeOpponentScore,
  getQuizChallengeParticipantName,
  getQuizChallengeUserScore,
  hasQuizChallengeUserSubmitted,
  type QuizChallengeRecord,
} from '../../src/features/quizChallenge';
import { describeError } from '../../utils/errorLogging';

const shuffleOptions = <T,>(values: T[]): T[] => {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const getCategoryLabel = (uiLanguage: string, category: QuizCategory): string => {
  const item = quizCategories.find((entry) => entry.key === category);
  return item ? t(uiLanguage, item.labelKey) : category;
};

export default function QuizScreen() {
  const { uiLanguage, theme, appearanceSettings, learningSettings } = useAppSettings();
  const { updateQuizProgress } = useAppProgress();
  const { user } = useAuthSessionState();
  const { profile } = useAuthProfileState();
  const { friends, leaderboard, fetchLeaderboard, sendQuizChallengeRequest, cancelQuizChallengeRequest } = useAuthSocialState();
  const colors = getColors(theme);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>(quizCategories[0].key);
  const [stage, setStage] = useState<'menu' | 'quiz' | 'result'>('menu');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [hasCurrentQuestionMistake, setHasCurrentQuestionMistake] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [activeQuizChallenge, setActiveQuizChallenge] = useState<QuizChallengeRecord | null>(null);
  const [isQuizChallengeBusy, setIsQuizChallengeBusy] = useState(false);
  const [sessionQuizChallengeId, setSessionQuizChallengeId] = useState<string | null>(null);
  const successAnimation = useRef(new Animated.Value(0)).current;
  const wrongShakeAnimation = useRef(new Animated.Value(0)).current;
  const cardEntranceAnimation = useRef(new Animated.Value(1)).current;
  const feedbackAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const optionScaleRefs = useRef<Animated.Value[]>([]);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredQuestions = useMemo(
    () => quizQuestions.filter((question) => question.category === selectedCategory),
    [selectedCategory],
  );

  const totalQuestions = filteredQuestions.length;
  const totalAvailableQuestions = quizQuestions.length;
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const localizedQuestion = currentQuestion
    ? getLocalizedQuizValue(currentQuestion.question, uiLanguage)
    : '';
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) {
      return [] as { label: string; originalIndex: number }[];
    }

    const localizedCurrentOptions = getLocalizedQuizValue(currentQuestion.options, uiLanguage);

    return shuffleOptions(
      localizedCurrentOptions.map((label, originalIndex) => ({
        label,
        originalIndex,
      })),
    );
  }, [currentQuestion, uiLanguage]);

  const friendEntries = useMemo(
    () => leaderboard.filter((entry) => friends.includes(entry.id) && entry.id !== user?.id),
    [friends, leaderboard, user?.id],
  );

  const selectedFriend = useMemo(
    () => friendEntries.find((entry) => entry.id === selectedFriendId) ?? null,
    [friendEntries, selectedFriendId],
  );

  const currentChallengeCategory = activeQuizChallenge?.category ?? null;
  const challengeOpponentName = getQuizChallengeParticipantName(activeQuizChallenge ?? {
    id: '',
    sender_id: '',
    receiver_id: '',
    status: 'pending',
    category: quizCategories[0].key,
    question_count: 0,
    created_at: '',
    accepted_at: null,
    started_at: null,
    completed_at: null,
    sender_score: null,
    sender_completed_at: null,
    receiver_score: null,
    receiver_completed_at: null,
    winner: null,
  }, user?.id);

  const challengeUserScore = activeQuizChallenge ? getQuizChallengeUserScore(activeQuizChallenge, user?.id) : null;
  const challengeOpponentScore = activeQuizChallenge ? getQuizChallengeOpponentScore(activeQuizChallenge, user?.id) : null;
  const challengeSubmitted = activeQuizChallenge ? hasQuizChallengeUserSubmitted(activeQuizChallenge, user?.id) : false;
  const challengeWinnerLabel = useMemo(() => {
    if (!activeQuizChallenge || activeQuizChallenge.status !== 'completed') {
      return null;
    }

    if (activeQuizChallenge.winner === 'tie') {
      return t(uiLanguage, 'quizChallengeTieLabel');
    }

    const currentUserWon = (activeQuizChallenge.winner === 'sender' && activeQuizChallenge.sender_id === user?.id)
      || (activeQuizChallenge.winner === 'receiver' && activeQuizChallenge.receiver_id === user?.id);

    return currentUserWon
      ? t(uiLanguage, 'quizChallengeWonLabel')
      : `${challengeOpponentName} ${t(uiLanguage, 'quizChallengeWinsSuffix')}`;
  }, [activeQuizChallenge, challengeOpponentName, uiLanguage, user?.id]);

  const clearAdvanceTimeout = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  const triggerHaptic = async (type: 'success' | 'warning' | 'impact') => {
    if (!learningSettings.hapticFeedback) {
      return;
    }

    try {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (type === 'warning') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fails silently on unsupported devices.
    }
  };

  const fetchLatestQuizChallenge = useCallback(async () => {
    if (!user) {
      setActiveQuizChallenge(null);
      return;
    }

    try {
      const active = sessionQuizChallengeId
        ? await fetchQuizChallengeById(sessionQuizChallengeId)
        : await fetchLatestQuizChallengeForUser(user.id);
      setActiveQuizChallenge(active);
    } catch (error) {
      console.error('[Quiz] Failed to fetch latest quiz challenge:', describeError(error));
    }
  }, [sessionQuizChallengeId, user]);

  useFocusEffect(
    useCallback(() => {
      void fetchLeaderboard();
      void fetchLatestQuizChallenge();
    }, [fetchLatestQuizChallenge, fetchLeaderboard]),
  );

  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void fetchLatestQuizChallenge(), 800);
    };

    const channel = supabase
      .channel(`quiz-screen-challenges-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_challenge_requests', filter: `sender_id=eq.${user.id}` }, debouncedFetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_challenge_requests', filter: `receiver_id=eq.${user.id}` }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [fetchLatestQuizChallenge, user]);

  useEffect(() => {
    const targetProgress = totalQuestions > 0 ? (currentQuestionIndex + 1) / totalQuestions : 0;

    if (!appearanceSettings.animationsEnabled) {
      progressAnimation.setValue(targetProgress);
      return;
    }

    Animated.timing(progressAnimation, {
      toValue: targetProgress,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [appearanceSettings.animationsEnabled, currentQuestionIndex, progressAnimation, totalQuestions]);

  useEffect(() => {
    if (!appearanceSettings.animationsEnabled || stage !== 'quiz') {
      cardEntranceAnimation.setValue(1);
      return;
    }

    cardEntranceAnimation.setValue(0);
    Animated.spring(cardEntranceAnimation, {
      toValue: 1,
      bounciness: 8,
      speed: 14,
      useNativeDriver: true,
    }).start();
  }, [appearanceSettings.animationsEnabled, cardEntranceAnimation, currentQuestionIndex, stage]);

  const getOptionScale = (index: number) => {
    if (!optionScaleRefs.current[index]) {
      optionScaleRefs.current[index] = new Animated.Value(1);
    }
    return optionScaleRefs.current[index];
  };

  const triggerOptionPressAnimation = (index: number) => {
    if (!appearanceSettings.animationsEnabled) {
      return;
    }

    const optionScale = getOptionScale(index);
    optionScale.setValue(1);
    Animated.sequence([
      Animated.timing(optionScale, {
        toValue: 0.97,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(optionScale, {
        toValue: 1,
        bounciness: 10,
        speed: 22,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerCorrectAnimation = () => {
    if (!appearanceSettings.animationsEnabled) {
      successAnimation.setValue(1);
      feedbackAnimation.setValue(1);
      return;
    }

    successAnimation.setValue(0);
    feedbackAnimation.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(successAnimation, {
          toValue: 1,
          bounciness: 14,
          speed: 20,
          useNativeDriver: true,
        }),
        Animated.spring(successAnimation, {
          toValue: 0,
          bounciness: 6,
          speed: 16,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(feedbackAnimation, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerWrongAnimation = () => {
    if (!appearanceSettings.animationsEnabled) {
      return;
    }

    wrongShakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(wrongShakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(wrongShakeAnimation, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(wrongShakeAnimation, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongShakeAnimation, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongShakeAnimation, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const submitQuizChallengeResult = useCallback(async (finalScore: number) => {
    if (!user || !sessionQuizChallengeId || !activeQuizChallenge) {
      return;
    }

    try {
      setIsQuizChallengeBusy(true);
      await submitQuizChallengeResultRequest({
        challengeId: sessionQuizChallengeId,
        userId: user.id,
        senderId: activeQuizChallenge.sender_id,
        finalScore,
      });
      await fetchLatestQuizChallenge();
    } catch (error) {
      console.error('[Quiz] Failed to submit quiz challenge result:', describeError(error));
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'quizChallengeSubmitError'));
    } finally {
      setIsQuizChallengeBusy(false);
    }
  }, [activeQuizChallenge, fetchLatestQuizChallenge, sessionQuizChallengeId, uiLanguage, user]);

  const handleAutoAdvance = () => {
    clearAdvanceTimeout();
    advanceTimeoutRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 2200);
  };

  const startQuizSession = (nextCategory: QuizCategory, challengeId?: string | null) => {
    clearAdvanceTimeout();
    setSelectedCategory(nextCategory);
    setSessionQuizChallengeId(challengeId ?? null);
    setStage('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerLocked(false);
    setHasCurrentQuestionMistake(false);
    successAnimation.setValue(0);
    feedbackAnimation.setValue(0);
    wrongShakeAnimation.setValue(0);
    progressAnimation.setValue(totalQuestions > 0 ? 1 / Math.max(filteredQuestions.length, 1) : 0);
    setScore(0);
  };

  const handleStartQuiz = () => {
    startQuizSession(selectedCategory, null);
  };

  const handleStartChallengeQuiz = () => {
    if (!activeQuizChallenge || activeQuizChallenge.status !== 'accepted') {
      return;
    }

    startQuizSession(activeQuizChallenge.category, activeQuizChallenge.id);
  };

  const handleSelectCategory = (category: QuizCategory) => {
    setSelectedCategory(category);
    startQuizSession(category, null);
  };

  const handleSendQuizChallenge = async () => {
    if (!selectedFriend) {
      return;
    }

    const { error } = await sendQuizChallengeRequest({
      receiverId: selectedFriend.id,
      category: selectedCategory,
      questionCount: filteredQuestions.length,
    });

    if (error) {
      // Use the translation key if the service returned one, otherwise
      // fall back to the raw message.
      const message = t(uiLanguage, error) || error;
      Alert.alert(t(uiLanguage, 'error'), message);
      return;
    }

    Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'quizChallengeRequestSent'));
  };

  const handleCancelQuizChallenge = () => {
    if (!activeQuizChallenge) {
      return;
    }

    Alert.alert(
      t(uiLanguage, 'quizChallengeCancelTitle'),
      t(uiLanguage, 'quizChallengeCancelBody'),
      [
        { text: t(uiLanguage, 'cancel'), style: 'cancel' },
        {
          text: t(uiLanguage, 'confirm'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await cancelQuizChallengeRequest(activeQuizChallenge.id);
              if (error) {
                Alert.alert(t(uiLanguage, 'error'), error);
                return;
              }
              setActiveQuizChallenge(null);
              setSessionQuizChallengeId(null);
            })();
          },
        },
      ],
    );
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (isAnswerLocked || !currentQuestion) {
      return;
    }

    const selectedOption = shuffledOptions[optionIndex];
    if (!selectedOption) {
      return;
    }

    setSelectedAnswerIndex(optionIndex);
    triggerOptionPressAnimation(optionIndex);
    void triggerHaptic('impact');

    if (selectedOption.originalIndex === currentQuestion.answerIndex) {
      setIsAnswerLocked(true);
      const shouldCountAnswer = !sessionQuizChallengeId || !hasCurrentQuestionMistake;
      if (shouldCountAnswer) {
        setScore((prev) => prev + 1);
      }
      triggerCorrectAnimation();
      void triggerHaptic('success');
      handleAutoAdvance();
      return;
    }

    setHasCurrentQuestionMistake(true);
    triggerWrongAnimation();
    void triggerHaptic('warning');
  };

  const handleNextQuestion = () => {
    clearAdvanceTimeout();
    if (currentQuestionIndex + 1 >= totalQuestions) {
      const finalScore = score;
      setStage('result');
      void updateQuizProgress({ score: finalScore, totalQuestions });
      if (sessionQuizChallengeId) {
        void submitQuizChallengeResult(finalScore);
      }
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswerIndex(null);
    setIsAnswerLocked(false);
    setHasCurrentQuestionMistake(false);
    successAnimation.setValue(0);
    feedbackAnimation.setValue(0);
    wrongShakeAnimation.setValue(0);
  };

  const handleBackToMenu = () => {
    clearAdvanceTimeout();
    setStage('menu');
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerLocked(false);
    setHasCurrentQuestionMistake(false);
    successAnimation.setValue(0);
    feedbackAnimation.setValue(0);
    wrongShakeAnimation.setValue(0);
    setScore(0);
    setSessionQuizChallengeId(null);
    void fetchLatestQuizChallenge();
  };

  const successScale = successAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const cardEntranceOpacity = cardEntranceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const cardEntranceTranslateY = cardEntranceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const feedbackTranslateY = feedbackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const quizCompletionPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {stage === 'menu' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
            <View style={[styles.heroIconWrap, { backgroundColor: colors.primary + '12' }] }>
              <HelpCircle color={colors.primary} size={24} />
            </View>
            <Text style={[styles.heroEyebrow, { color: colors.primary }]}>{t(uiLanguage, 'quiz')}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'quiz')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizMenuSubtitle')}</Text>

            <View style={styles.heroStatsRow}>
              <View style={[styles.heroStatCard, { backgroundColor: colors.background, borderColor: colors.border }] }>
                <Sparkles color={colors.primary} size={18} />
                <Text style={[styles.heroStatValue, { color: colors.text }]}>{totalAvailableQuestions}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizQuestionCount')}</Text>
              </View>
              <View style={[styles.heroStatCard, { backgroundColor: colors.background, borderColor: colors.border }] }>
                <Target color={colors.primary} size={18} />
                <Text style={[styles.heroStatValue, { color: colors.text }]}>{quizCategories.length}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'modes')}</Text>
              </View>
            </View>
          </View>

          {activeQuizChallenge && (
            <View style={[styles.multiplayerCard, { backgroundColor: colors.cardBackground, borderColor: colors.primary }] }>
              <View style={styles.multiplayerHeader}>
                <View style={styles.multiplayerTitleRow}>
                  <Swords color={colors.primary} size={20} />
                  <Text style={[styles.multiplayerTitle, { color: colors.text }]}>{t(uiLanguage, 'quizChallengeCardTitle')}</Text>
                </View>
                <TouchableOpacity onPress={() => void fetchLatestQuizChallenge()}>
                  <Text style={[styles.challengeRefresh, { color: colors.primary }]}>↻</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.multiplayerBody, { color: colors.textSecondary }]}>
                {challengeOpponentName} • {getCategoryLabel(uiLanguage, currentChallengeCategory ?? selectedCategory)}
              </Text>

              {activeQuizChallenge.status === 'accepted' ? (
                <>
                  <Text style={[styles.challengeHintText, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizChallengeAcceptedHint')}</Text>
                  <TouchableOpacity
                    style={[styles.challengeLaunchButton, { backgroundColor: colors.primary }]}
                    onPress={handleStartChallengeQuiz}
                    disabled={challengeSubmitted}
                  >
                    <Text style={styles.challengeLaunchButtonText}>
                      {challengeSubmitted ? t(uiLanguage, 'quizChallengeWaitingOpponent') : t(uiLanguage, 'quizChallengeLaunch')}
                    </Text>
                  </TouchableOpacity>
                  {activeQuizChallenge.sender_id === user?.id && (
                    <TouchableOpacity
                      style={[styles.quizChallengeCancelButton, { borderColor: colors.error }]}
                      onPress={handleCancelQuizChallenge}
                    >
                      <Text style={[styles.quizChallengeCancelButtonText, { color: colors.error }]}>{t(uiLanguage, 'quizChallengeCancel')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : activeQuizChallenge.status === 'pending' ? (
                <>
                  <Text style={[styles.challengeHintText, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizChallengeWaitingAccept')}</Text>
                  {activeQuizChallenge.sender_id === user?.id && (
                    <TouchableOpacity
                      style={[styles.quizChallengeCancelButton, { borderColor: colors.error }]}
                      onPress={handleCancelQuizChallenge}
                    >
                      <Text style={[styles.quizChallengeCancelButtonText, { color: colors.error }]}>{t(uiLanguage, 'quizChallengeCancel')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={[styles.challengeScoreBoard, { backgroundColor: colors.background, borderColor: colors.border }] }>
                  <View style={styles.challengeScoreColumn}>
                    <Text style={[styles.challengeScoreName, { color: colors.text }]}>{profile?.username ?? t(uiLanguage, 'xpChallengeYou')}</Text>
                    <Text style={[styles.challengeScoreValue, { color: colors.primary }]}>{challengeUserScore ?? '-'}</Text>
                  </View>
                  <View style={styles.challengeScoreColumn}>
                    <Text style={[styles.challengeScoreName, { color: colors.text }]}>{challengeOpponentName}</Text>
                    <Text style={[styles.challengeScoreValue, { color: colors.primary }]}>{challengeOpponentScore ?? '-'}</Text>
                  </View>
                  <Text style={[styles.challengeResultText, { color: colors.success }]}>{challengeWinnerLabel}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'quizModeTitle')}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizModeSubtitle')}</Text>
          </View>

          <View style={styles.categoryList}>
            {quizCategories.map((category) => {
              const isActive = selectedCategory === category.key;
              const questionCount = quizQuestions.filter((question) => question.category === category.key).length;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isActive ? colors.primary : colors.cardBackground,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category.key)}
                  activeOpacity={0.82}
                >
                  <View style={styles.categoryCardTop}>
                    <View style={[styles.categoryPill, { backgroundColor: isActive ? '#FFFFFF22' : colors.primary + '12' }]}>
                      <Text style={[styles.categoryPillText, { color: isActive ? '#FFFFFF' : colors.primary }]}>
                        {isActive ? t(uiLanguage, 'quizCategoryReady') : t(uiLanguage, 'quizCategoryMode')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.categoryText, { color: isActive ? '#FFFFFF' : colors.text }]}>
                    {t(uiLanguage, category.labelKey)}
                  </Text>
                  <Text style={[styles.categoryDescription, { color: isActive ? '#EEF2FF' : colors.textSecondary }]}>
                    {questionCount} {t(uiLanguage, 'quizCategoryQuestionCount')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.inlineStartButton, { backgroundColor: isActive ? '#FFFFFF22' : colors.primary }]}
                    onPress={() => handleSelectCategory(category.key)}
                  >
                    <Text style={[styles.inlineStartButtonText, { color: '#FFFFFF' }]}>{t(uiLanguage, 'quizStartSolo')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'quizChallengeSectionTitle')}</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizChallengeSectionBody')}</Text>
          </View>

          <View style={[styles.multiplayerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
            <View style={styles.multiplayerTitleRow}>
              <Users color={colors.primary} size={20} />
              <Text style={[styles.multiplayerTitle, { color: colors.text }]}>{t(uiLanguage, 'quizChallengeSelectFriend')}</Text>
            </View>

            {friendEntries.length === 0 ? (
              <Text style={[styles.multiplayerBody, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizChallengeNoFriends')}</Text>
            ) : (
              <>
                <View style={styles.friendList}>
                  {friendEntries.map((entry) => {
                    const isSelected = selectedFriendId === entry.id;
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={[
                          styles.friendChip,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '15' : colors.background,
                          },
                        ]}
                        onPress={() => setSelectedFriendId(entry.id)}
                      >
                        <Text style={[styles.friendChipText, { color: isSelected ? colors.primary : colors.text }]}>{entry.username}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.multiplayerBody, { color: colors.textSecondary }]}>
                  {selectedFriend
                    ? `${selectedFriend.username} • ${getCategoryLabel(uiLanguage, selectedCategory)} • ${filteredQuestions.length} questions`
                    : t(uiLanguage, 'quizChallengeSelectFriendHint')}
                </Text>
                <TouchableOpacity
                  style={[styles.challengeLaunchButton, { backgroundColor: !selectedFriend || isQuizChallengeBusy ? colors.border : colors.primary }]}
                  onPress={() => void handleSendQuizChallenge()}
                  disabled={!selectedFriend || isQuizChallengeBusy}
                >
                  <Text style={styles.challengeLaunchButtonText}>{t(uiLanguage, 'quizChallengeSend')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      )}

      {stage === 'quiz' && currentQuestion && (
        <View style={styles.gameWrapper}>
          <View style={styles.gameHeader}>
            <TouchableOpacity
              style={[styles.ghostButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={handleBackToMenu}
              activeOpacity={0.82}
            >
              <Text style={[styles.ghostButtonText, { color: colors.text }]}>{t(uiLanguage, 'quizBackToMenu')}</Text>
            </TouchableOpacity>
            <View style={[styles.scoreBadge, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
              <Text style={[styles.scoreBadgeValue, { color: colors.text }]}>{score}</Text>
              <Text style={[styles.scoreBadgeLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'scoreLabel')}</Text>
            </View>
          </View>

          {sessionQuizChallengeId && activeQuizChallenge && (
            <View style={[styles.liveChallengeBanner, { backgroundColor: colors.cardBackground, borderColor: colors.primary }] }>
              <Text style={[styles.liveChallengeTitle, { color: colors.text }]}>{t(uiLanguage, 'quizChallengeLiveTitle')}</Text>
              <Text style={[styles.liveChallengeBody, { color: colors.textSecondary }]}>vs {challengeOpponentName} • {getCategoryLabel(uiLanguage, activeQuizChallenge.category)}</Text>
            </View>
          )}

          <View style={[styles.progressCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
            <View style={styles.progressHeaderRow}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>{t(uiLanguage, 'quizQuestionLabel')} {currentQuestionIndex + 1}</Text>
              <Text style={[styles.progressHint, { color: colors.textSecondary }]}>{totalQuestions} {t(uiLanguage, 'quizProgressTotal')}</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }] }>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.gameContent} showsVerticalScrollIndicator={false}>
            <Animated.View
              style={[
                styles.questionCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: cardEntranceOpacity,
                  transform: [
                    { translateY: cardEntranceTranslateY },
                    { translateX: wrongShakeAnimation },
                    { scale: successScale },
                  ],
                },
              ]}
            >
              <View style={styles.questionHeader}>
                <View style={[styles.questionChip, { backgroundColor: colors.primary + '12' }] }>
                  <Text style={[styles.questionChipText, { color: colors.primary }]}>{t(uiLanguage, 'quizQuestionLabel')} {currentQuestionIndex + 1}</Text>
                </View>
                <Text style={[styles.referenceTop, { color: colors.textTertiary }]}>{currentQuestion.reference}</Text>
              </View>

              <Text style={[styles.questionTitle, { color: colors.text }]}>{localizedQuestion}</Text>

              <View style={styles.optionsSection}>
                {shuffledOptions.map((option, optionIndex) => {
                  const isSelected = optionIndex === selectedAnswerIndex;
                  const isCorrect = option.originalIndex === currentQuestion.answerIndex;
                  const showCorrect = isAnswerLocked && isCorrect;
                  const showIncorrect = !isAnswerLocked && isSelected && !isCorrect;
                  const accentColor = showCorrect
                    ? colors.success
                    : showIncorrect
                      ? colors.error
                      : isSelected
                        ? colors.primary
                        : colors.border;
                  const backgroundColor = showCorrect
                    ? colors.success + '12'
                    : showIncorrect
                      ? colors.error + '12'
                      : isSelected
                        ? colors.primary + '10'
                        : colors.background;

                  return (
                    <Animated.View key={`${currentQuestion.id}-${optionIndex}`} style={{ transform: [{ scale: getOptionScale(optionIndex) }] }}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor,
                            borderColor: accentColor,
                          },
                        ]}
                        onPress={() => handleSelectAnswer(optionIndex)}
                        disabled={isAnswerLocked}
                        activeOpacity={0.82}
                      >
                        <View style={[styles.optionBadge, { backgroundColor: showCorrect ? colors.success : showIncorrect ? colors.error : colors.cardBackground, borderColor: accentColor }] }>
                          <Text style={[styles.optionBadgeText, { color: showCorrect || showIncorrect ? '#FFFFFF' : colors.text }]}>
                            {String.fromCharCode(65 + optionIndex)}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {selectedAnswerIndex !== null && (
                <Animated.View
                  style={{
                    opacity: feedbackAnimation,
                    transform: [{ translateY: feedbackTranslateY }],
                  }}
                >
                  <View
                    style={[
                      styles.feedbackCard,
                      {
                        backgroundColor:
                          shuffledOptions[selectedAnswerIndex]?.originalIndex === currentQuestion.answerIndex
                            ? colors.success + '12'
                            : colors.error + '12',
                        borderColor:
                          shuffledOptions[selectedAnswerIndex]?.originalIndex === currentQuestion.answerIndex
                            ? colors.success
                            : colors.error,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedbackText,
                        {
                          color:
                            shuffledOptions[selectedAnswerIndex]?.originalIndex === currentQuestion.answerIndex
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      {shuffledOptions[selectedAnswerIndex]?.originalIndex === currentQuestion.answerIndex
                        ? t(uiLanguage, 'correct')
                        : t(uiLanguage, 'incorrect')}
                    </Text>
                    <Text style={[styles.referenceText, { color: colors.textSecondary }]}>{currentQuestion.reference}</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      )}

      {stage === 'result' && (
        <View style={styles.resultWrapper}>
          <View style={[styles.resultCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }] }>
            <View style={[styles.resultIconWrap, { backgroundColor: colors.primary + '12' }] }>
              <Trophy color={colors.primary} size={28} />
            </View>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t(uiLanguage, 'quizCompletedTitle')}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'quizCompletedSubtitle')}</Text>
            <View style={[styles.scorePanel, { backgroundColor: colors.background, borderColor: colors.border }] }>
              <Text style={[styles.scorePanelValue, { color: colors.text }]}>{score}/{totalQuestions}</Text>
              <Text style={[styles.scorePanelLabel, { color: colors.textSecondary }]}>{quizCompletionPercent}% réussite</Text>
            </View>

            {sessionQuizChallengeId && (
              <View style={[styles.resultChallengeCard, { backgroundColor: colors.background, borderColor: colors.border }] }>
                <Text style={[styles.resultChallengeTitle, { color: colors.text }]}>{t(uiLanguage, 'quizChallengeResultTitle')}</Text>
                {activeQuizChallenge?.status === 'completed' ? (
                  <>
                    <Text style={[styles.resultChallengeScore, { color: colors.primary }]}>{challengeUserScore ?? score} - {challengeOpponentScore ?? '-'}</Text>
                    <Text style={[styles.resultChallengeBody, { color: colors.textSecondary }]}>{challengeWinnerLabel}</Text>
                  </>
                ) : (
                  <Text style={[styles.resultChallengeBody, { color: colors.textSecondary }]}>
                    {isQuizChallengeBusy ? t(uiLanguage, 'quizChallengeSubmitting') : t(uiLanguage, 'quizChallengeWaitingOpponent')}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleStartQuiz}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>{t(uiLanguage, 'quizPlayAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleBackToMenu}
              activeOpacity={0.82}
            >
              <Text style={[styles.ghostButtonText, { color: colors.text }]}>{t(uiLanguage, 'quizBackToMenu')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 26,
    paddingBottom: 150,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 28,
    elevation: 6,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  heroStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 6,
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    minHeight: 150,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },
  categoryCardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryText: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
  },
  categoryDescription: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 20,
  },
  inlineStartButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inlineStartButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  multiplayerCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    marginTop: 18,
    gap: 12,
  },
  multiplayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  multiplayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multiplayerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  multiplayerBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  challengeHintText: {
    fontSize: 13,
    lineHeight: 19,
  },
  friendList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  friendChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  friendChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  challengeLaunchButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  challengeLaunchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  quizChallengeCancelButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  quizChallengeCancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  challengeRefresh: {
    fontSize: 18,
    fontWeight: '700',
  },
  challengeScoreBoard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  challengeScoreColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeScoreName: {
    fontSize: 14,
    fontWeight: '700',
  },
  challengeScoreValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  challengeResultText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  gameWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 14,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveChallengeBanner: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  liveChallengeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  liveChallengeBody: {
    fontSize: 13,
  },
  ghostButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ghostButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 78,
  },
  scoreBadgeValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  scoreBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  gameContent: {
    paddingBottom: 150,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 20,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 28,
    elevation: 6,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  questionChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  questionChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  referenceTop: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  optionsSection: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '800',
  },
  referenceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  resultWrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  resultIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  scorePanel: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
  },
  scorePanelValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scorePanelLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultChallengeCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  resultChallengeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  resultChallengeScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  resultChallengeBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
