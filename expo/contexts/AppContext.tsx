import React, { useMemo, type PropsWithChildren } from 'react';

import type {
  AppearanceSettings,
  DyslexiaSettings,
  Language,
  LearningMode,
  LearningSettings,
  QuizProgress,
  StreakProgress,
  Theme,
  TTSSettings,
  ValidationSettings,
  VerseProgress,
  XpProgress,
} from '../types/database';
import type { NotificationSettings } from '../utils/notifications';
import { AppProgressProvider, useAppProgress } from './app/AppProgressContext';
import { AppSettingsProvider, useAppSettings } from './app/AppSettingsContext';

export interface AppState {
  language: Language;
  uiLanguage: string;
  learningMode: LearningMode;
  theme: Theme;
  progress: VerseProgress[];
  dyslexiaSettings: DyslexiaSettings;
  validationSettings: ValidationSettings;
  appearanceSettings: AppearanceSettings;
  learningSettings: LearningSettings;
  ttsSettings: TTSSettings;
  customVersionUrl: string | null;
  quizProgress: QuizProgress;
  streakProgress: StreakProgress;
  streakLossEventId: number;
  xpProgress: XpProgress;
  recentXpGain: { amount: number; id: number } | null;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  hasHandledStartupVerse: boolean;
  markStartupVerseHandled: () => void;
  setLanguage: (language: Language) => Promise<void>;
  setLearningMode: (mode: LearningMode) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDyslexiaSettings: (settings: Partial<DyslexiaSettings>) => Promise<void>;
  setValidationSettings: (settings: Partial<ValidationSettings>) => Promise<void>;
  setAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  setLearningSettings: (settings: Partial<LearningSettings>) => Promise<void>;
  setTTSSettings: (settings: Partial<TTSSettings>) => Promise<void>;
  setCustomVersionUrl: (versionName: string, content: string) => Promise<void>;
  getVerseProgress: (book: string, chapter: number, verse: number) => VerseProgress | undefined;
  updateProgress: (progress: VerseProgress, options?: { skipXp?: boolean; xpMultiplier?: number }) => Promise<{ streakAdvanced: boolean; currentStreak: number }>;
  updateQuizProgress: (result: { score: number; totalQuestions: number }) => Promise<void>;
  resetScoreProgress: () => Promise<void>;
  resetVerseProgress: (book: string, chapter: number, verse: number) => Promise<void>;
  toggleMemorized: (book: string, chapter: number, verse: number) => Promise<void>;
  isLoading: boolean;
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <AppSettingsProvider>
      <AppProgressProvider>{children}</AppProgressProvider>
    </AppSettingsProvider>
  );
}

export function useApp(): AppState {
  const settings = useAppSettings();
  const progress = useAppProgress();

  return useMemo(() => ({
    language: settings.language,
    uiLanguage: settings.uiLanguage,
    learningMode: settings.learningMode,
    theme: settings.theme,
    progress: progress.progress,
    dyslexiaSettings: settings.dyslexiaSettings,
    validationSettings: settings.validationSettings,
    appearanceSettings: settings.appearanceSettings,
    learningSettings: settings.learningSettings,
    ttsSettings: settings.ttsSettings,
    customVersionUrl: settings.customVersionUrl,
    quizProgress: progress.quizProgress,
    streakProgress: progress.streakProgress,
    streakLossEventId: progress.streakLossEventId,
    xpProgress: progress.xpProgress,
    recentXpGain: progress.recentXpGain,
    notificationSettings: settings.notificationSettings,
    setNotificationSettings: (nextSettings) => settings.setNotificationSettings(nextSettings, progress.streakProgress),
    hasHandledStartupVerse: settings.hasHandledStartupVerse,
    markStartupVerseHandled: settings.markStartupVerseHandled,
    setLanguage: settings.setLanguage,
    setLearningMode: settings.setLearningMode,
    setTheme: settings.setTheme,
    setDyslexiaSettings: settings.setDyslexiaSettings,
    setValidationSettings: settings.setValidationSettings,
    setAppearanceSettings: settings.setAppearanceSettings,
    setLearningSettings: settings.setLearningSettings,
    setTTSSettings: settings.setTTSSettings,
    setCustomVersionUrl: settings.setCustomVersionUrl,
    getVerseProgress: progress.getVerseProgress,
    updateProgress: progress.updateProgress,
    updateQuizProgress: progress.updateQuizProgress,
    resetScoreProgress: progress.resetScoreProgress,
    resetVerseProgress: progress.resetVerseProgress,
    toggleMemorized: progress.toggleMemorized,
    isLoading: settings.isLoading || progress.isLoading,
  }), [progress, settings]);
}

export { useAppProgress } from './app/AppProgressContext';
export { useAppSettings } from './app/AppSettingsContext';
