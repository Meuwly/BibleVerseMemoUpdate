export const STORAGE_KEYS = {
  language: '@language',
  learningMode: '@learning_mode',
  theme: '@theme',
  progress: '@verse_progress',
  dyslexia: '@dyslexia_settings',
  validation: '@validation_settings',
  appearance: '@appearance_settings',
  learningSettings: '@learning_settings',
  ttsSettings: '@tts_settings',
  customVersion: '@custom_version',
  quizProgress: '@quiz_progress',
  streakProgress: '@streak_progress',
  xpProgress: '@xp_progress',
  xpBoostState: '@xp_boost_state',
  notificationSettings: '@notification_settings',
} as const;

export const APP_STORAGE_TABLE = 'user_app_state';

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
