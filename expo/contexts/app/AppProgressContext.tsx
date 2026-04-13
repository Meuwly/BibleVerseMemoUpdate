import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { QuizProgress, StreakProgress, VerseProgress, XpProgress } from '../../types/database';
import { describeError } from '../../utils/errorLogging';
import { preloadAllBiblesIfNeeded } from '../../utils/database';
import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import { getDefaultSrsState, normalizeVerseProgress } from '../../src/srs/spacedRepetition';
import { STORAGE_KEYS, resetAppStorageCache, safeJsonParse, storageGetItem, storageSetItem } from '../../src/features/app/services/appStorage';
import { enqueueBusinessEvent, flushUserStateSyncQueue, hydrateDedicatedStateFromStorage } from '../../src/features/app/services/userStateSync';
import { USER_STATE_SCOPE_KEYS } from '../../src/features/app/services/userStateScopes';
import { useAppSettings } from './AppSettingsContext';

interface XpBoostState {
  day: string;
  activations: number;
  activeUntil: string | null;
}

export interface AppProgressState {
  progress: VerseProgress[];
  quizProgress: QuizProgress;
  streakProgress: StreakProgress;
  streakLossEventId: number;
  xpProgress: XpProgress;
  recentXpGain: { amount: number; id: number } | null;
  isLoading: boolean;
  getVerseProgress: (book: string, chapter: number, verse: number) => VerseProgress | undefined;
  updateProgress: (progress: VerseProgress, options?: { skipXp?: boolean; xpMultiplier?: number }) => Promise<{ streakAdvanced: boolean; currentStreak: number }>;
  updateQuizProgress: (result: { score: number; totalQuestions: number }) => Promise<void>;
  resetScoreProgress: () => Promise<void>;
  resetVerseProgress: (book: string, chapter: number, verse: number) => Promise<void>;
  toggleMemorized: (book: string, chapter: number, verse: number) => Promise<void>;
}

const DEFAULT_XP_BOOST_STATE: XpBoostState = {
  day: '',
  activations: 0,
  activeUntil: null,
};

const DEFAULT_QUIZ_PROGRESS: QuizProgress = {
  quizzesCompleted: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  bestScore: 0,
  lastPlayedAt: null,
};

const DEFAULT_STREAK_PROGRESS: StreakProgress = {
  currentStreak: 0,
  bestStreak: 0,
  lastActivityDate: null,
};

const DEFAULT_XP_PROGRESS: XpProgress = {
  totalXp: 0,
  sessionsCompleted: 0,
  lastEarnedAt: null,
};

export const [AppProgressProvider, useAppProgress] = createContextHook<AppProgressState>(() => {
  const { notificationSettings, rescheduleNotifications } = useAppSettings();
  const [progress, setProgress] = useState<VerseProgress[]>([]);
  const [quizProgress, setQuizProgressState] = useState<QuizProgress>(DEFAULT_QUIZ_PROGRESS);
  const [streakProgress, setStreakProgressState] = useState<StreakProgress>(DEFAULT_STREAK_PROGRESS);
  const [streakLossEventId, setStreakLossEventId] = useState(0);
  const [xpProgress, setXpProgressState] = useState<XpProgress>(DEFAULT_XP_PROGRESS);
  const [recentXpGain, setRecentXpGain] = useState<{ amount: number; id: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streakProgressRef = useRef<StreakProgress>(DEFAULT_STREAK_PROGRESS);

  useEffect(() => {
    preloadAllBiblesIfNeeded().catch((error) => {
      console.error('[AppProgressContext] Failed to preload bible cache:', error);
    });
  }, []);

  const hydrateProgressScopes = useCallback(async (userId: string) => {
    const scopedKeys = [
      ...USER_STATE_SCOPE_KEYS.verse_progress,
      ...USER_STATE_SCOPE_KEYS.quiz_stats,
      ...USER_STATE_SCOPE_KEYS.streak_state,
    ];
    const storageEntries = await AsyncStorage.multiGet(scopedKeys);
    await hydrateDedicatedStateFromStorage(userId, Object.fromEntries(storageEntries.filter(([, value]) => value !== null) as [string, string][]));
    await flushUserStateSyncQueue();
  }, []);

  const getCurrentLocalDate = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const isNextDay = useCallback((previousDate: string, currentDate: string) => {
    const previous = new Date(`${previousDate}T00:00:00`);
    const current = new Date(`${currentDate}T00:00:00`);
    const diff = current.getTime() - previous.getTime();
    const oneDayMs = 1000 * 60 * 60 * 24;
    return Math.round(diff / oneDayMs) === 1;
  }, []);

  const computeUpdatedStreak = useCallback((previous: StreakProgress): { next: StreakProgress; lost: boolean } => {
    const today = getCurrentLocalDate();

    if (previous.lastActivityDate === today) {
      return { next: previous, lost: false };
    }

    if (!previous.lastActivityDate) {
      return {
        next: {
          currentStreak: 1,
          bestStreak: Math.max(previous.bestStreak, 1),
          lastActivityDate: today,
        },
        lost: false,
      };
    }

    if (!isNextDay(previous.lastActivityDate, today)) {
      return {
        next: {
          currentStreak: 0,
          bestStreak: previous.bestStreak,
          lastActivityDate: today,
        },
        lost: previous.currentStreak > 0,
      };
    }

    const currentStreak = previous.currentStreak + 1;
    return {
      next: {
        currentStreak,
        bestStreak: Math.max(previous.bestStreak, currentStreak),
        lastActivityDate: today,
      },
      lost: false,
    };
  }, [getCurrentLocalDate, isNextDay]);

  const normalizeStreakOnLoad = useCallback((previous: StreakProgress): { next: StreakProgress; lost: boolean } => {
    if (!previous.lastActivityDate) {
      return { next: previous, lost: false };
    }

    const today = getCurrentLocalDate();
    if (previous.lastActivityDate === today || isNextDay(previous.lastActivityDate, today)) {
      return { next: previous, lost: false };
    }

    return {
      next: {
        currentStreak: 0,
        bestStreak: previous.bestStreak,
        lastActivityDate: today,
      },
      lost: previous.currentStreak > 0,
    };
  }, [getCurrentLocalDate, isNextDay]);

  const registerDailyActivity = useCallback(async (): Promise<{ streakAdvanced: boolean; currentStreak: number }> => {
    const previousStreak = streakProgressRef.current;
    const { next: nextStreak, lost } = computeUpdatedStreak(previousStreak);

    if (nextStreak === previousStreak) {
      return {
        streakAdvanced: false,
        currentStreak: previousStreak.currentStreak,
      };
    }

    streakProgressRef.current = nextStreak;
    setStreakProgressState(nextStreak);
    if (lost) {
      setStreakLossEventId(Date.now());
    }

    await storageSetItem(STORAGE_KEYS.streakProgress, JSON.stringify(nextStreak));
    if (notificationSettings.streakWarningEnabled) {
      await rescheduleNotifications(nextStreak);
    }

    void enqueueBusinessEvent('streak_event', {
      event_type: lost ? 'streak_reset' : (nextStreak.currentStreak > previousStreak.currentStreak ? 'streak_advanced' : 'streak_updated'),
      previous_streak: previousStreak.currentStreak,
      current_streak: nextStreak.currentStreak,
      best_streak: nextStreak.bestStreak,
      event_date: nextStreak.lastActivityDate,
      payload: nextStreak,
    });

    return {
      streakAdvanced: nextStreak.currentStreak > previousStreak.currentStreak,
      currentStreak: nextStreak.currentStreak,
    };
  }, [computeUpdatedStreak, notificationSettings.streakWarningEnabled, rescheduleNotifications]);

  const awardXp = useCallback(async (amount: number) => {
    if (amount <= 0) {
      return;
    }

    setXpProgressState((prev) => {
      const next: XpProgress = {
        totalXp: prev.totalXp + amount,
        sessionsCompleted: prev.sessionsCompleted + 1,
        lastEarnedAt: new Date().toISOString(),
      };
      void storageSetItem(STORAGE_KEYS.xpProgress, JSON.stringify(next));
      return next;
    });

    setRecentXpGain({ amount, id: Date.now() });
  }, []);

  const loadProgressState = useCallback(async () => {
    try {
      const [savedProgress, savedQuizProgress, savedStreakProgress, savedXpProgress, savedXpBoostState] = await Promise.all([
        storageGetItem(STORAGE_KEYS.progress),
        storageGetItem(STORAGE_KEYS.quizProgress),
        storageGetItem(STORAGE_KEYS.streakProgress),
        storageGetItem(STORAGE_KEYS.xpProgress),
        storageGetItem(STORAGE_KEYS.xpBoostState),
      ]);

      const parsedProgress = safeJsonParse(savedProgress, [] as VerseProgress[]).map(normalizeVerseProgress);
      setProgress(parsedProgress);
      if (savedProgress) {
        await storageSetItem(STORAGE_KEYS.progress, JSON.stringify(parsedProgress));
      }

      setQuizProgressState({
        ...DEFAULT_QUIZ_PROGRESS,
        ...safeJsonParse(savedQuizProgress, {} as Partial<QuizProgress>),
      });

      const loadedStreakProgress = {
        ...DEFAULT_STREAK_PROGRESS,
        ...safeJsonParse(savedStreakProgress, {} as Partial<StreakProgress>),
      };
      const { next: normalizedStreak, lost: lostStreakOnLoad } = normalizeStreakOnLoad(loadedStreakProgress);
      streakProgressRef.current = normalizedStreak;
      setStreakProgressState(normalizedStreak);
      if (lostStreakOnLoad) {
        setStreakLossEventId(Date.now());
      }
      if (normalizedStreak !== loadedStreakProgress) {
        await storageSetItem(STORAGE_KEYS.streakProgress, JSON.stringify(normalizedStreak));
      }

      setXpProgressState({
        ...DEFAULT_XP_PROGRESS,
        ...safeJsonParse(savedXpProgress, {} as Partial<XpProgress>),
      });

      const loadedXpBoostState = {
        ...DEFAULT_XP_BOOST_STATE,
        ...safeJsonParse(savedXpBoostState, {} as Partial<XpBoostState>),
      };
      if (
        loadedXpBoostState.day !== DEFAULT_XP_BOOST_STATE.day
        || loadedXpBoostState.activations !== DEFAULT_XP_BOOST_STATE.activations
        || loadedXpBoostState.activeUntil !== DEFAULT_XP_BOOST_STATE.activeUntil
      ) {
        await storageSetItem(STORAGE_KEYS.xpBoostState, JSON.stringify(DEFAULT_XP_BOOST_STATE));
      }

      await rescheduleNotifications(normalizedStreak);
    } catch (error) {
      console.error(`[AppProgressContext] Error loading progress state: ${describeError(error)}`, error);
    } finally {
      setIsLoading(false);
    }
  }, [normalizeStreakOnLoad, rescheduleNotifications]);

  useEffect(() => {
    void loadProgressState();
  }, [loadProgressState]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resetAppStorageCache(session?.user?.id ?? null);
      void loadProgressState();
      if (session?.user?.id) {
        void hydrateProgressScopes(session.user.id);
      }
      void flushUserStateSyncQueue();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateProgressScopes, loadProgressState]);

  useEffect(() => {
    streakProgressRef.current = streakProgress;
  }, [streakProgress]);

  const getVerseProgress = useCallback((book: string, chapter: number, verse: number) => {
    return progress.find((item) => item.book === book && item.chapter === chapter && item.verse === verse);
  }, [progress]);

  const updateProgress = useCallback(async (verseProgress: VerseProgress, options?: { skipXp?: boolean; xpMultiplier?: number }) => {
    const normalizedVerseProgress = normalizeVerseProgress(verseProgress);
    const existingProgress = progress.find(
      (item) => item.book === normalizedVerseProgress.book
        && item.chapter === normalizedVerseProgress.chapter
        && item.verse === normalizedVerseProgress.verse,
    );

    const existingIndex = progress.findIndex(
      (item) => item.book === normalizedVerseProgress.book
        && item.chapter === normalizedVerseProgress.chapter
        && item.verse === normalizedVerseProgress.verse,
    );

    const nextProgress = existingIndex >= 0
      ? progress.map((item, index) => (index === existingIndex ? normalizedVerseProgress : item))
      : [...progress, normalizedVerseProgress];

    const isAlreadyCompletedVerse = Boolean(existingProgress?.completed);
    const attemptsXpRate = isAlreadyCompletedVerse ? 1 : 2;
    const correctXpRate = isAlreadyCompletedVerse ? 4 : 8;
    const correctGain = Math.max((normalizedVerseProgress.correctGuesses || 0) - (existingProgress?.correctGuesses || 0), 0) * correctXpRate;
    const attemptsGain = correctGain > 0
      ? Math.max((normalizedVerseProgress.attempts || 0) - (existingProgress?.attempts || 0), 0) * attemptsXpRate
      : 0;
    const masteryGain = Math.max((normalizedVerseProgress.masteryLevel || 0) - (existingProgress?.masteryLevel || 0), 0) * 12;
    const completionGain = normalizedVerseProgress.completed && !existingProgress?.completed ? 25 : 0;
    const baseEarnedXp = attemptsGain + correctGain + masteryGain + completionGain;
    const normalizedXpMultiplier = options?.xpMultiplier === undefined ? 1 : Math.min(Math.max(options.xpMultiplier, 0), 1);
    const earnedXp = baseEarnedXp <= 0 ? 0 : Math.max(1, Math.round(baseEarnedXp * normalizedXpMultiplier));

    setProgress(nextProgress);

    const [, dailyActivity] = await Promise.all([
      storageSetItem(STORAGE_KEYS.progress, JSON.stringify(nextProgress)),
      registerDailyActivity(),
      options?.skipXp ? Promise.resolve() : awardXp(earnedXp),
    ]);

    void enqueueBusinessEvent('verse_review', {
      book: normalizedVerseProgress.book,
      chapter: normalizedVerseProgress.chapter,
      verse: normalizedVerseProgress.verse,
      attempts: normalizedVerseProgress.attempts,
      correct_guesses: normalizedVerseProgress.correctGuesses,
      mastery_level: normalizedVerseProgress.masteryLevel,
      completed: normalizedVerseProgress.completed,
      memorized: normalizedVerseProgress.memorized ?? false,
      reviewed_at: normalizedVerseProgress.lastPracticed,
      payload: normalizedVerseProgress,
    });

    return dailyActivity;
  }, [awardXp, progress, registerDailyActivity]);

  const updateQuizProgress = useCallback(async (result: { score: number; totalQuestions: number }) => {
    const newBestScore = Math.max(quizProgress.bestScore, result.score);
    const nextQuizProgress: QuizProgress = {
      quizzesCompleted: quizProgress.quizzesCompleted + 1,
      questionsAnswered: quizProgress.questionsAnswered + result.totalQuestions,
      correctAnswers: quizProgress.correctAnswers + result.score,
      bestScore: newBestScore,
      lastPlayedAt: new Date().toISOString(),
    };

    const questionsGain = Math.max(result.totalQuestions, 0) * 3;
    const scoreGain = Math.max(result.score, 0) * 5;
    const completionGain = result.totalQuestions > 0 ? 20 : 0;
    const bestScoreGain = newBestScore > quizProgress.bestScore ? 15 : 0;
    const earnedXp = questionsGain + scoreGain + completionGain + bestScoreGain;

    setQuizProgressState(nextQuizProgress);
    await Promise.all([
      storageSetItem(STORAGE_KEYS.quizProgress, JSON.stringify(nextQuizProgress)),
      registerDailyActivity(),
      awardXp(earnedXp),
    ]);

    void enqueueBusinessEvent('quiz_attempt', {
      score: Math.max(result.score, 0),
      total_questions: Math.max(result.totalQuestions, 0),
      earned_xp: earnedXp,
      attempted_at: new Date().toISOString(),
      payload: nextQuizProgress,
    });
  }, [awardXp, quizProgress.bestScore, quizProgress.correctAnswers, quizProgress.quizzesCompleted, quizProgress.questionsAnswered, registerDailyActivity]);

  const resetScoreProgress = useCallback(async () => {
    const resetQuiz: QuizProgress = { ...DEFAULT_QUIZ_PROGRESS };
    const resetStreak: StreakProgress = { ...DEFAULT_STREAK_PROGRESS };
    const resetXp: XpProgress = { ...DEFAULT_XP_PROGRESS };

    setProgress([]);
    setQuizProgressState(resetQuiz);
    streakProgressRef.current = resetStreak;
    setStreakProgressState(resetStreak);
    setStreakLossEventId(0);
    setXpProgressState(resetXp);
    setRecentXpGain(null);

    await Promise.all([
      storageSetItem(STORAGE_KEYS.progress, JSON.stringify([])),
      storageSetItem(STORAGE_KEYS.quizProgress, JSON.stringify(resetQuiz)),
      storageSetItem(STORAGE_KEYS.streakProgress, JSON.stringify(resetStreak)),
      storageSetItem(STORAGE_KEYS.xpProgress, JSON.stringify(resetXp)),
      storageSetItem(STORAGE_KEYS.xpBoostState, JSON.stringify(DEFAULT_XP_BOOST_STATE)),
    ]);
    await rescheduleNotifications(resetStreak);
  }, [rescheduleNotifications]);

  const resetVerseProgress = useCallback(async (book: string, chapter: number, verse: number) => {
    const nextProgress = progress.filter((item) => !(item.book === book && item.chapter === chapter && item.verse === verse));
    setProgress(nextProgress);
    await storageSetItem(STORAGE_KEYS.progress, JSON.stringify(nextProgress));
  }, [progress]);

  const toggleMemorized = useCallback(async (book: string, chapter: number, verse: number) => {
    const existingProgress = getVerseProgress(book, chapter, verse);
    const newMemorizedState = !existingProgress?.memorized;

    const verseProgress: VerseProgress = existingProgress
      ? {
        ...existingProgress,
        memorized: newMemorizedState,
        srs: newMemorizedState ? (existingProgress.srs ?? getDefaultSrsState()) : getDefaultSrsState(),
      }
      : {
        book,
        chapter,
        verse,
        attempts: 0,
        correctGuesses: 0,
        lastPracticed: new Date().toISOString(),
        completed: false,
        started: false,
        masteryLevel: 0,
        memorized: newMemorizedState,
        srs: getDefaultSrsState(),
      };

    await updateProgress(verseProgress);
  }, [getVerseProgress, updateProgress]);

  return useMemo(() => ({
    progress,
    quizProgress,
    streakProgress,
    streakLossEventId,
    xpProgress,
    recentXpGain,
    isLoading,
    getVerseProgress,
    updateProgress,
    updateQuizProgress,
    resetScoreProgress,
    resetVerseProgress,
    toggleMemorized,
  }), [
    getVerseProgress,
    isLoading,
    progress,
    quizProgress,
    recentXpGain,
    resetScoreProgress,
    resetVerseProgress,
    streakLossEventId,
    streakProgress,
    toggleMemorized,
    updateProgress,
    updateQuizProgress,
    xpProgress,
  ]);
});
