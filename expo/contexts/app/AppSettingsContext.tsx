import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

import { getDefaultLanguageForLocales } from '../../constants/languages';
import { getLanguageFromBibleVersion } from '../../constants/translations';
import type {
  AppearanceSettings,
  DyslexiaSettings,
  Language,
  LearningMode,
  LearningSettings,
  StreakProgress,
  Theme,
  TTSSettings,
  ValidationSettings,
} from '../../types/database';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  cancelDailyReminder,
  cancelStreakWarning,
  requestNotificationPermissions,
  scheduleDailyReminder,
  scheduleStreakWarning,
} from '../../utils/notifications';
import { describeError } from '../../utils/errorLogging';
import { isSupabaseConfigured, supabase } from '../../src/lib/supabase';
import {
  STORAGE_KEYS,
  resetAppStorageCache,
  safeJsonParse,
  storageGetItem,
  storageRemoveItem,
  storageSetItem,
} from '../../src/features/app/services/appStorage';
import { flushUserStateSyncQueue, hydrateDedicatedStateFromStorage } from '../../src/features/app/services/userStateSync';
import { USER_STATE_SCOPE_KEYS } from '../../src/features/app/services/userStateScopes';

const MIN_VALIDATION_TOLERANCE = 0.75;
const APP_STORAGE_SAFE_TEXT_LENGTH = 500_000;

type CustomVersionsMap = Record<string, string>;

export interface AppSettingsState {
  language: Language;
  uiLanguage: string;
  learningMode: LearningMode;
  theme: Theme;
  dyslexiaSettings: DyslexiaSettings;
  validationSettings: ValidationSettings;
  appearanceSettings: AppearanceSettings;
  learningSettings: LearningSettings;
  ttsSettings: TTSSettings;
  customVersionUrl: string | null;
  notificationSettings: NotificationSettings;
  hasHandledStartupVerse: boolean;
  isLoading: boolean;
  setLanguage: (language: Language) => Promise<void>;
  setLearningMode: (mode: LearningMode) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDyslexiaSettings: (settings: Partial<DyslexiaSettings>) => Promise<void>;
  setValidationSettings: (settings: Partial<ValidationSettings>) => Promise<void>;
  setAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  setLearningSettings: (settings: Partial<LearningSettings>) => Promise<void>;
  setTTSSettings: (settings: Partial<TTSSettings>) => Promise<void>;
  setCustomVersionUrl: (versionName: string, content: string) => Promise<void>;
  setNotificationSettings: (settings: Partial<NotificationSettings>, streak: StreakProgress) => Promise<void>;
  rescheduleNotifications: (streak: StreakProgress, settingsOverride?: NotificationSettings) => Promise<void>;
  markStartupVerseHandled: () => void;
}

function normalizeValidationSettings(settings: Partial<ValidationSettings>): ValidationSettings {
  return {
    toleranceLevel: Math.max(settings.toleranceLevel ?? 0.85, MIN_VALIDATION_TOLERANCE),
    allowLetterInversion: settings.allowLetterInversion ?? false,
    ignorePunctuation: settings.ignorePunctuation ?? true,
    ignoreAccents: settings.ignoreAccents ?? true,
  };
}

function parseCustomVersions(value: string | null): CustomVersionsMap {
  if (!value) {
    return {};
  }

  const parsed = safeJsonParse<CustomVersionsMap | string>(value, {});
  if (typeof parsed === 'string') {
    return {};
  }

  return parsed;
}

function isCursorWindowError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('cursorwindow');
}

async function getCustomVersionsSafely(): Promise<CustomVersionsMap> {
  try {
    const savedCustomVersion = await storageGetItem(STORAGE_KEYS.customVersion);
    return parseCustomVersions(savedCustomVersion);
  } catch (error) {
    if (isCursorWindowError(error)) {
      console.warn('[AppSettingsContext] Custom versions storage row too large. Resetting custom versions.');
      await storageRemoveItem(STORAGE_KEYS.customVersion);
      return {};
    }

    throw error;
  }
}

function getUILanguage(bibleVersion: Language): string {
  const mapped = getLanguageFromBibleVersion(bibleVersion);
  return mapped || 'en';
}

function detectDeviceLocales(): string[] {
  const localeCandidates = new Set<string>();

  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (intlLocale) {
    localeCandidates.add(intlLocale);
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    navigator.languages?.forEach((locale) => localeCandidates.add(locale));
    if (navigator.language) {
      localeCandidates.add(navigator.language);
    }
  }

  const settingsManager = NativeModules.SettingsManager as {
    settings?: {
      AppleLanguages?: string[];
      AppleLocale?: string;
    };
  } | undefined;
  settingsManager?.settings?.AppleLanguages?.forEach((locale) => localeCandidates.add(locale));
  if (settingsManager?.settings?.AppleLocale) {
    localeCandidates.add(settingsManager.settings.AppleLocale);
  }

  const i18nManager = NativeModules.I18nManager as {
    localeIdentifier?: string;
  } | undefined;
  if (i18nManager?.localeIdentifier) {
    localeCandidates.add(i18nManager.localeIdentifier);
  }

  return Array.from(localeCandidates);
}

export const [AppSettingsProvider, useAppSettings] = createContextHook<AppSettingsState>(() => {
  const [language, setLanguageState] = useState<Language>('LSG');
  const [learningMode, setLearningModeState] = useState<LearningMode>('guess-verse');
  const [theme, setThemeState] = useState<Theme>('light');
  const [dyslexiaSettings, setDyslexiaSettingsState] = useState<DyslexiaSettings>({
    fontSize: 18,
    lineHeight: 32,
    wordSpacing: 0,
  });
  const [validationSettings, setValidationSettingsState] = useState<ValidationSettings>(() => normalizeValidationSettings({}));
  const [appearanceSettings, setAppearanceSettingsState] = useState<AppearanceSettings>({
    animationsEnabled: true,
    showStartupVerse: true,
    startupVerseMode: 'random',
    enableVerseComparison: false,
    comparisonVersion: null,
  });
  const [learningSettings, setLearningSettingsState] = useState<LearningSettings>({
    autoAdvance: false,
    showHints: true,
    maxHints: 90,
    autoMarkMemorized: true,
    autoMarkThreshold: 5,
    hapticFeedback: true,
    maxMasteryLevel: 20,
    focusMode: false,
  });
  const [ttsSettings, setTTSSettingsState] = useState<TTSSettings>({
    speed: 'normal',
    voiceIdentifier: undefined,
  });
  const [customVersionUrl, setCustomVersionUrlState] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [hasHandledStartupVerse, setHasHandledStartupVerse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const uiLanguage = useMemo(() => getUILanguage(language), [language]);

  const hydrateSettingsScopes = useCallback(async (userId: string) => {
    const storageEntries = await AsyncStorage.multiGet(USER_STATE_SCOPE_KEYS.preferences);
    await hydrateDedicatedStateFromStorage(userId, Object.fromEntries(storageEntries.filter(([, value]) => value !== null) as [string, string][]));
    await flushUserStateSyncQueue();
  }, []);

  const getNotificationTexts = useCallback(() => {
    const isFr = uiLanguage.startsWith('fr');
    return {
      dailyTitle: 'Bible Verse Memo',
      dailyBody: isFr
        ? "C'est l'heure de t'entraîner ! Ouvre l'app pour mémoriser tes versets."
        : 'Time to practice! Open the app to memorize your verses.',
      streakTitle: isFr ? 'Ta flamme est en danger !' : 'Your streak is at risk!',
      streakBody: isFr
        ? "Tu risques de perdre ta série si tu ne joues pas aujourd'hui. Ouvre l'app maintenant !"
        : "You might lose your streak if you don't practice today. Open the app now!",
    };
  }, [uiLanguage]);

  const rescheduleNotifications = useCallback(async (streak: StreakProgress, settingsOverride?: NotificationSettings) => {
    const texts = getNotificationTexts();
    const effectiveSettings = settingsOverride ?? notificationSettings;

    if (effectiveSettings.dailyReminderEnabled) {
      await scheduleDailyReminder(
        effectiveSettings.dailyReminderHour,
        effectiveSettings.dailyReminderMinute,
        texts.dailyTitle,
        texts.dailyBody,
      );
    } else {
      await cancelDailyReminder();
    }

    if (effectiveSettings.streakWarningEnabled && streak.currentStreak > 0) {
      await scheduleStreakWarning(streak.lastActivityDate, texts.streakTitle, texts.streakBody);
    } else {
      await cancelStreakWarning();
    }
  }, [getNotificationTexts, notificationSettings]);

  const loadSettings = useCallback(async () => {
    try {
      const [
        savedLanguage,
        savedMode,
        savedTheme,
        savedDyslexia,
        savedValidation,
        savedAppearance,
        savedLearning,
        savedTTS,
        savedNotificationSettings,
      ] = await Promise.all([
        storageGetItem(STORAGE_KEYS.language),
        storageGetItem(STORAGE_KEYS.learningMode),
        storageGetItem(STORAGE_KEYS.theme),
        storageGetItem(STORAGE_KEYS.dyslexia),
        storageGetItem(STORAGE_KEYS.validation),
        storageGetItem(STORAGE_KEYS.appearance),
        storageGetItem(STORAGE_KEYS.learningSettings),
        storageGetItem(STORAGE_KEYS.ttsSettings),
        storageGetItem(STORAGE_KEYS.notificationSettings),
      ]);

      const customVersions = await getCustomVersionsSafely();

      if (savedLanguage) {
        setLanguageState(savedLanguage as Language);
      } else {
        const detectedLanguage = getDefaultLanguageForLocales(detectDeviceLocales());
        if (detectedLanguage) {
          setLanguageState(detectedLanguage);
          await storageSetItem(STORAGE_KEYS.language, detectedLanguage);
        }
      }
      if (savedMode) {
        setLearningModeState(savedMode as LearningMode);
      }
      if (savedTheme) {
        setThemeState(savedTheme as Theme);
      }

      setDyslexiaSettingsState((prev) => ({
        ...prev,
        ...safeJsonParse(savedDyslexia, {} as Partial<DyslexiaSettings>),
      }));

      const parsedValidation = safeJsonParse(savedValidation, {} as Partial<ValidationSettings>);
      const normalizedValidation = normalizeValidationSettings(parsedValidation);
      setValidationSettingsState(normalizedValidation);
      if (savedValidation && normalizedValidation.toleranceLevel !== parsedValidation.toleranceLevel) {
        await storageSetItem(STORAGE_KEYS.validation, JSON.stringify(normalizedValidation));
      }

      setAppearanceSettingsState((prev) => ({
        ...prev,
        ...safeJsonParse(savedAppearance, {} as Partial<AppearanceSettings>),
      }));
      setLearningSettingsState((prev) => ({
        ...prev,
        ...safeJsonParse(savedLearning, {} as Partial<LearningSettings>),
      }));
      setTTSSettingsState((prev) => ({
        ...prev,
        ...safeJsonParse(savedTTS, {} as Partial<TTSSettings>),
      }));

      const loadedNotificationSettings = safeJsonParse(savedNotificationSettings, DEFAULT_NOTIFICATION_SETTINGS);
      setNotificationSettingsState(loadedNotificationSettings);

      if (savedLanguage?.startsWith('CUSTOM_') && customVersions[savedLanguage]) {
        setCustomVersionUrlState(customVersions[savedLanguage]);
      }
    } catch (error) {
      console.error(`[AppSettingsContext] Error loading settings: ${describeError(error)}`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resetAppStorageCache(session?.user?.id ?? null);
      void loadSettings();
      if (session?.user?.id) {
        void hydrateSettingsScopes(session.user.id);
      }
      void flushUserStateSyncQueue();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateSettingsScopes, loadSettings]);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    await storageSetItem(STORAGE_KEYS.language, nextLanguage);
  }, []);

  const setLearningMode = useCallback(async (mode: LearningMode) => {
    setLearningModeState(mode);
    await storageSetItem(STORAGE_KEYS.learningMode, mode);
  }, []);

  const setTheme = useCallback(async (nextTheme: Theme) => {
    setThemeState(nextTheme);
    await storageSetItem(STORAGE_KEYS.theme, nextTheme);
  }, []);

  const setDyslexiaSettings = useCallback(async (settings: Partial<DyslexiaSettings>) => {
    setDyslexiaSettingsState((prev) => {
      const next = { ...prev, ...settings };
      void storageSetItem(STORAGE_KEYS.dyslexia, JSON.stringify(next));
      return next;
    });
  }, []);

  const setValidationSettings = useCallback(async (settings: Partial<ValidationSettings>) => {
    setValidationSettingsState((prev) => {
      const next = normalizeValidationSettings({ ...prev, ...settings });
      void storageSetItem(STORAGE_KEYS.validation, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAppearanceSettings = useCallback(async (settings: Partial<AppearanceSettings>) => {
    setAppearanceSettingsState((prev) => {
      const next = { ...prev, ...settings };
      void storageSetItem(STORAGE_KEYS.appearance, JSON.stringify(next));
      return next;
    });
  }, []);

  const setLearningSettings = useCallback(async (settings: Partial<LearningSettings>) => {
    setLearningSettingsState((prev) => {
      const next = { ...prev, ...settings };
      void storageSetItem(STORAGE_KEYS.learningSettings, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTTSSettings = useCallback(async (settings: Partial<TTSSettings>) => {
    setTTSSettingsState((prev) => {
      const next = { ...prev, ...settings };
      void storageSetItem(STORAGE_KEYS.ttsSettings, JSON.stringify(next));
      return next;
    });
  }, []);

  const setNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>, streak: StreakProgress) => {
    const nextSettings = { ...notificationSettings, ...settings };
    const needsPermission = nextSettings.dailyReminderEnabled || nextSettings.streakWarningEnabled;

    if (needsPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.log('[AppSettingsContext] Notification permission denied, reverting');
        return;
      }
    }

    setNotificationSettingsState(nextSettings);
    await storageSetItem(STORAGE_KEYS.notificationSettings, JSON.stringify(nextSettings));
    await rescheduleNotifications(streak, nextSettings);
  }, [notificationSettings, rescheduleNotifications]);

  const setCustomVersionUrl = useCallback(async (versionName: string, content: string) => {
    if (content.length > APP_STORAGE_SAFE_TEXT_LENGTH) {
      throw new Error('Custom version file is too large for reliable local storage on this device');
    }

    const customVersions = await getCustomVersionsSafely();
    customVersions[versionName] = content;
    await storageSetItem(STORAGE_KEYS.customVersion, JSON.stringify(customVersions));
    setCustomVersionUrlState(content);
  }, []);

  const markStartupVerseHandled = useCallback(() => {
    setHasHandledStartupVerse(true);
  }, []);

  return useMemo(() => ({
    language,
    uiLanguage,
    learningMode,
    theme,
    dyslexiaSettings,
    validationSettings,
    appearanceSettings,
    learningSettings,
    ttsSettings,
    customVersionUrl,
    notificationSettings,
    hasHandledStartupVerse,
    isLoading,
    setLanguage,
    setLearningMode,
    setTheme,
    setDyslexiaSettings,
    setValidationSettings,
    setAppearanceSettings,
    setLearningSettings,
    setTTSSettings,
    setCustomVersionUrl,
    setNotificationSettings,
    rescheduleNotifications,
    markStartupVerseHandled,
  }), [
    appearanceSettings,
    customVersionUrl,
    dyslexiaSettings,
    hasHandledStartupVerse,
    isLoading,
    language,
    learningMode,
    learningSettings,
    markStartupVerseHandled,
    notificationSettings,
    rescheduleNotifications,
    setAppearanceSettings,
    setCustomVersionUrl,
    setDyslexiaSettings,
    setLanguage,
    setLearningMode,
    setLearningSettings,
    setNotificationSettings,
    setTTSSettings,
    setTheme,
    setValidationSettings,
    theme,
    ttsSettings,
    uiLanguage,
    validationSettings,
  ]);
});
