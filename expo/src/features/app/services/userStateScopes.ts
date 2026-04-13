import type {
  AppearanceSettings,
  DyslexiaSettings,
  LearningSettings,
  QuizProgress,
  StreakProgress,
  TTSSettings,
  ValidationSettings,
  VerseProgress,
} from '../../../../types/database';
import type { NotificationSettings } from '../../../../utils/notifications';
import { REWARDS_CARDS_KEY, REWARDS_SETTINGS_KEY, REWARDS_STATE_KEY, REWARDS_VITRAIL_KEY } from '../../../storage/migrations';
import type { RewardCardsState, RewardSettings, RewardState, VitrailState } from '../../../rewards/types';
import { STORAGE_KEYS, safeJsonParse } from './appStorageShared';

export type UserStateScope = 'preferences' | 'verse_progress' | 'quiz_stats' | 'streak_state' | 'reward_state';

export interface UserPreferencesSnapshot {
  language: string;
  learning_mode: string;
  theme: string;
  dyslexia_settings: DyslexiaSettings;
  validation_settings: ValidationSettings;
  appearance_settings: AppearanceSettings;
  learning_settings: LearningSettings;
  tts_settings: TTSSettings;
  notification_settings: NotificationSettings;
  custom_versions: Record<string, string>;
}

export interface VerseProgressRow {
  book: string;
  chapter: number;
  verse: number;
  attempts: number;
  correct_guesses: number;
  last_practiced: string;
  completed: boolean;
  started: boolean;
  mastery_level: number;
  memorized: boolean;
  srs: VerseProgress['srs'] | null;
}

export interface QuizStatsSnapshot {
  quizzes_completed: number;
  questions_answered: number;
  correct_answers: number;
  best_score: number;
  last_played_at: string | null;
}

export interface StreakStateSnapshot {
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
}

export interface RewardStateSnapshot {
  settings: RewardSettings;
  state: RewardState;
  vitrail: VitrailState;
  cards: RewardCardsState;
}

export const USER_STATE_SCOPE_KEYS: Record<UserStateScope, string[]> = {
  preferences: [
    STORAGE_KEYS.language,
    STORAGE_KEYS.learningMode,
    STORAGE_KEYS.theme,
    STORAGE_KEYS.dyslexia,
    STORAGE_KEYS.validation,
    STORAGE_KEYS.appearance,
    STORAGE_KEYS.learningSettings,
    STORAGE_KEYS.ttsSettings,
    STORAGE_KEYS.notificationSettings,
    STORAGE_KEYS.customVersion,
  ],
  verse_progress: [STORAGE_KEYS.progress],
  quiz_stats: [STORAGE_KEYS.quizProgress],
  streak_state: [STORAGE_KEYS.streakProgress],
  reward_state: [REWARDS_SETTINGS_KEY, REWARDS_STATE_KEY, REWARDS_VITRAIL_KEY, REWARDS_CARDS_KEY],
};

export function getScopeForStorageKey(key: string): UserStateScope | null {
  return (Object.entries(USER_STATE_SCOPE_KEYS) as [UserStateScope, string[]][]).find(([, keys]) => keys.includes(key))?.[0] ?? null;
}

function clampNumber(value: number, minimum = 0): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.max(minimum, Math.floor(value));
}

export function buildPreferencesSnapshot(storage: Record<string, string>): UserPreferencesSnapshot | null {
  const hasAnyValue = USER_STATE_SCOPE_KEYS.preferences.some((key) => storage[key] !== undefined);
  if (!hasAnyValue) {
    return null;
  }

  return {
    language: storage[STORAGE_KEYS.language] ?? 'LSG',
    learning_mode: storage[STORAGE_KEYS.learningMode] ?? 'guess-verse',
    theme: storage[STORAGE_KEYS.theme] ?? 'light',
    dyslexia_settings: safeJsonParse(storage[STORAGE_KEYS.dyslexia] ?? null, {
      fontSize: 18,
      lineHeight: 32,
      wordSpacing: 0,
    }),
    validation_settings: safeJsonParse(storage[STORAGE_KEYS.validation] ?? null, {
      toleranceLevel: 0.85,
      allowLetterInversion: false,
      ignorePunctuation: true,
      ignoreAccents: true,
    }),
    appearance_settings: safeJsonParse(storage[STORAGE_KEYS.appearance] ?? null, {
      animationsEnabled: true,
      showStartupVerse: true,
      enableVerseComparison: false,
      comparisonVersion: null,
    }),
    learning_settings: safeJsonParse(storage[STORAGE_KEYS.learningSettings] ?? null, {
      autoAdvance: false,
      showHints: true,
      maxHints: 90,
      autoMarkMemorized: true,
      autoMarkThreshold: 5,
      hapticFeedback: true,
      maxMasteryLevel: 20,
      focusMode: false,
    }),
    tts_settings: safeJsonParse(storage[STORAGE_KEYS.ttsSettings] ?? null, {
      speed: 'normal',
      voiceIdentifier: undefined,
    }),
    notification_settings: safeJsonParse(storage[STORAGE_KEYS.notificationSettings] ?? null, {
      dailyReminderEnabled: false,
      dailyReminderHour: 19,
      dailyReminderMinute: 0,
      streakWarningEnabled: true,
    }),
    custom_versions: safeJsonParse(storage[STORAGE_KEYS.customVersion] ?? null, {} as Record<string, string>),
  };
}

export function buildVerseProgressRows(storage: Record<string, string>): VerseProgressRow[] | null {
  const parsed = safeJsonParse<VerseProgress[]>(storage[STORAGE_KEYS.progress] ?? null, []);
  if (parsed.length === 0) {
    return null;
  }

  return parsed.map((item) => ({
    book: item.book,
    chapter: clampNumber(item.chapter, 1),
    verse: clampNumber(item.verse, 1),
    attempts: clampNumber(item.attempts),
    correct_guesses: clampNumber(item.correctGuesses),
    last_practiced: item.lastPracticed,
    completed: Boolean(item.completed),
    started: Boolean(item.started),
    mastery_level: clampNumber(item.masteryLevel),
    memorized: Boolean(item.memorized),
    srs: item.srs ?? null,
  }));
}

export function buildQuizStatsSnapshot(storage: Record<string, string>): QuizStatsSnapshot | null {
  const parsed = safeJsonParse<QuizProgress | null>(storage[STORAGE_KEYS.quizProgress] ?? null, null);
  if (!parsed) {
    return null;
  }

  return {
    quizzes_completed: clampNumber(parsed.quizzesCompleted),
    questions_answered: clampNumber(parsed.questionsAnswered),
    correct_answers: clampNumber(parsed.correctAnswers),
    best_score: clampNumber(parsed.bestScore),
    last_played_at: parsed.lastPlayedAt ?? null,
  };
}

export function buildStreakStateSnapshot(storage: Record<string, string>): StreakStateSnapshot | null {
  const parsed = safeJsonParse<StreakProgress | null>(storage[STORAGE_KEYS.streakProgress] ?? null, null);
  if (!parsed) {
    return null;
  }

  return {
    current_streak: clampNumber(parsed.currentStreak),
    best_streak: clampNumber(parsed.bestStreak),
    last_activity_date: parsed.lastActivityDate ?? null,
  };
}

export function buildRewardStateSnapshot(storage: Record<string, string>): RewardStateSnapshot | null {
  const hasRewardData = USER_STATE_SCOPE_KEYS.reward_state.some((key) => storage[key] !== undefined);
  if (!hasRewardData) {
    return null;
  }

  return {
    settings: safeJsonParse<RewardSettings>(storage[REWARDS_SETTINGS_KEY] ?? null, {
      enableRewards: true,
      enableHaptics: true,
      enableSound: false,
      enableSurprises: true,
      dailyGoal: 3,
      weeklyGoal: 10,
      streakEnabled: true,
      supportReminderEnabled: true,
    }),
    state: safeJsonParse<RewardState>(storage[REWARDS_STATE_KEY] ?? null, {
      dayKey: '',
      completedToday: 0,
      weekKey: '',
      completedThisWeek: 0,
      surprisesToday: 0,
      lastSurpriseAt: null,
      sessionFullScreenShownAt: null,
      streakCount: 0,
      lastActiveDayKey: null,
      graceDaysRemaining: 2,
      graceMonthKey: '',
    }),
    vitrail: safeJsonParse<VitrailState>(storage[REWARDS_VITRAIL_KEY] ?? null, { tiles: {} }),
    cards: safeJsonParse<RewardCardsState>(storage[REWARDS_CARDS_KEY] ?? null, { list: [] }),
  };
}
