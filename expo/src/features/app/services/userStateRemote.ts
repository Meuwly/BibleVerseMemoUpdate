import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { describeError } from '../../../../utils/errorLogging';
import { APP_STORAGE_TABLE, STORAGE_KEYS } from './appStorageShared';
import {
  buildPreferencesSnapshot,
  buildQuizStatsSnapshot,
  buildRewardStateSnapshot,
  buildStreakStateSnapshot,
  buildVerseProgressRows,
  type RewardStateSnapshot,
  type UserPreferencesSnapshot,
  type UserStateScope,
} from './userStateScopes';

export interface RemoteUserStateSnapshot {
  storage: Record<string, string>;
  scopeUpdatedAt: Partial<Record<UserStateScope, string>>;
}

export interface LoadRemoteOptions {
  /**
   * When set, only verse_progress rows with updated_at strictly greater than
   * this ISO timestamp are fetched (incremental sync). The caller is responsible
   * for merging the partial result with its local baseline.
   */
  verseProgressSyncAfter?: string;
}

interface ScopeSyncOperation {
  scope: UserStateScope;
  userId: string;
  storage: Record<string, string>;
  updatedAt: string;
}

interface EventSyncOperation {
  eventType: 'verse_review' | 'quiz_attempt' | 'streak_event' | 'reward_event';
  userId: string;
  payload: Record<string, unknown>;
}

const warnedMissingTables = new Set<string>();

function getClient(): SupabaseClient {
  return supabase;
}

function normalizeJsonRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(([, entry]) => typeof entry === 'string');
  return Object.fromEntries(entries) as Record<string, string>;
}

function assignIfPresent(storage: Record<string, string>, key: string, value: string | null | undefined): void {
  if (value !== null && value !== undefined) {
    storage[key] = value;
  }
}

function buildStorageFromPreferences(storage: Record<string, string>, preferences: UserPreferencesSnapshot | null): void {
  if (!preferences) {
    return;
  }

  assignIfPresent(storage, STORAGE_KEYS.language, preferences.language);
  assignIfPresent(storage, STORAGE_KEYS.learningMode, preferences.learning_mode);
  assignIfPresent(storage, STORAGE_KEYS.theme, preferences.theme);
  storage[STORAGE_KEYS.dyslexia] = JSON.stringify(preferences.dyslexia_settings);
  storage[STORAGE_KEYS.validation] = JSON.stringify(preferences.validation_settings);
  storage[STORAGE_KEYS.appearance] = JSON.stringify(preferences.appearance_settings);
  storage[STORAGE_KEYS.learningSettings] = JSON.stringify(preferences.learning_settings);
  storage[STORAGE_KEYS.ttsSettings] = JSON.stringify(preferences.tts_settings);
  storage[STORAGE_KEYS.notificationSettings] = JSON.stringify(preferences.notification_settings);
  storage[STORAGE_KEYS.customVersion] = JSON.stringify(preferences.custom_versions ?? {});
}

function rethrowPostgrest(error: PostgrestError | null): void {
  if (error) {
    throw error;
  }
}

function isMissingSchemaTableError(error: PostgrestError | null, tableName: string): boolean {
  if (!error) {
    return false;
  }

  const normalizedMessage = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return error.code === 'PGRST205' && normalizedMessage.includes(tableName.toLowerCase());
}

function warnMissingDedicatedTable(tableName: string): void {
  if (warnedMissingTables.has(tableName)) {
    return;
  }

  warnedMissingTables.add(tableName);
  console.warn(
    `[UserStateSync] Table "${tableName}" is missing in Supabase. `
    + 'Run supabase/user_state_normalization.sql to enable dedicated sync for this scope.',
  );
}

export async function loadRemoteUserStateSnapshot(userId: string, options?: LoadRemoteOptions): Promise<RemoteUserStateSnapshot> {
  if (!isSupabaseConfigured) {
    return { storage: {}, scopeUpdatedAt: {} };
  }

  const client = getClient();

  let verseProgressQuery = client
    .from('verse_progress')
    .select('book, chapter, verse, attempts, correct_guesses, last_practiced, completed, started, mastery_level, memorized, srs, client_updated_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (options?.verseProgressSyncAfter) {
    verseProgressQuery = verseProgressQuery.gt('updated_at', options.verseProgressSyncAfter);
  }

  const [legacyResult, preferencesResult, verseProgressResult, quizStatsResult, streakStateResult] = await Promise.all([
    client.from(APP_STORAGE_TABLE).select('storage, updated_at').eq('user_id', userId).maybeSingle(),
    client.from('user_preferences').select('language, learning_mode, theme, dyslexia_settings, validation_settings, appearance_settings, learning_settings, tts_settings, notification_settings, custom_versions, client_updated_at, updated_at').eq('user_id', userId).maybeSingle(),
    verseProgressQuery,
    client.from('user_quiz_stats').select('quizzes_completed, questions_answered, correct_answers, best_score, last_played_at, client_updated_at, updated_at').eq('user_id', userId).maybeSingle(),
    client.from('user_streak_state').select('current_streak, best_streak, last_activity_date, client_updated_at, updated_at').eq('user_id', userId).maybeSingle(),
  ]);

  rethrowPostgrest(legacyResult.error);
  rethrowPostgrest(preferencesResult.error);
  rethrowPostgrest(verseProgressResult.error);
  rethrowPostgrest(quizStatsResult.error);
  rethrowPostgrest(streakStateResult.error);

  const storage = normalizeJsonRecord(legacyResult.data?.storage);
  const scopeUpdatedAt: Partial<Record<UserStateScope, string>> = {};

  if (preferencesResult.data) {
    buildStorageFromPreferences(storage, preferencesResult.data as UserPreferencesSnapshot);
    scopeUpdatedAt.preferences = preferencesResult.data.client_updated_at ?? preferencesResult.data.updated_at;
  }

  if (verseProgressResult.data && verseProgressResult.data.length > 0) {
    storage[STORAGE_KEYS.progress] = JSON.stringify(verseProgressResult.data.map((entry) => ({
      book: entry.book,
      chapter: entry.chapter,
      verse: entry.verse,
      attempts: entry.attempts,
      correctGuesses: entry.correct_guesses,
      lastPracticed: entry.last_practiced,
      completed: entry.completed,
      started: entry.started,
      masteryLevel: entry.mastery_level,
      memorized: entry.memorized,
      srs: entry.srs ?? undefined,
    })));
    scopeUpdatedAt.verse_progress = verseProgressResult.data[0].client_updated_at ?? verseProgressResult.data[0].updated_at;
  }

  if (quizStatsResult.data) {
    storage[STORAGE_KEYS.quizProgress] = JSON.stringify({
      quizzesCompleted: quizStatsResult.data.quizzes_completed,
      questionsAnswered: quizStatsResult.data.questions_answered,
      correctAnswers: quizStatsResult.data.correct_answers,
      bestScore: quizStatsResult.data.best_score,
      lastPlayedAt: quizStatsResult.data.last_played_at,
    });
    scopeUpdatedAt.quiz_stats = quizStatsResult.data.client_updated_at ?? quizStatsResult.data.updated_at;
  }

  if (streakStateResult.data) {
    storage[STORAGE_KEYS.streakProgress] = JSON.stringify({
      currentStreak: streakStateResult.data.current_streak,
      bestStreak: streakStateResult.data.best_streak,
      lastActivityDate: streakStateResult.data.last_activity_date,
    });
    scopeUpdatedAt.streak_state = streakStateResult.data.client_updated_at ?? streakStateResult.data.updated_at;
  }

  return { storage, scopeUpdatedAt };
}

export async function loadRemoteRewardStateSnapshot(userId: string): Promise<{ snapshot: RewardStateSnapshot | null; updatedAt: string | null }> {
  if (!isSupabaseConfigured) {
    return { snapshot: null, updatedAt: null };
  }

  const { data, error } = await getClient().from('user_reward_state').select('settings, state, vitrail, cards, client_updated_at, updated_at').eq('user_id', userId).maybeSingle();
  if (isMissingSchemaTableError(error, 'user_reward_state')) {
    warnMissingDedicatedTable('user_reward_state');
    return { snapshot: null, updatedAt: null };
  }

  rethrowPostgrest(error);

  if (!data) {
    return { snapshot: null, updatedAt: null };
  }

  const snapshot: RewardStateSnapshot = {
    settings: data.settings,
    state: data.state,
    vitrail: data.vitrail,
    cards: data.cards,
  };
  return { snapshot, updatedAt: data.client_updated_at ?? data.updated_at };
}

export async function pushScopeSyncOperation(operation: ScopeSyncOperation): Promise<void> {
  const client = getClient();
  const { userId, storage, updatedAt, scope } = operation;

  if (scope === 'preferences') {
    const snapshot = buildPreferencesSnapshot(storage);
    if (!snapshot) {
      return;
    }

    const { error } = await client.from('user_preferences').upsert({
      user_id: userId,
      ...snapshot,
      client_updated_at: updatedAt,
      updated_at: new Date().toISOString(),
    });
    rethrowPostgrest(error);
    return;
  }

  if (scope === 'verse_progress') {
    const rows = buildVerseProgressRows(storage) ?? [];

    if (rows.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const { error } = await client.from('verse_progress').upsert(
      rows.map((row) => ({
        user_id: userId,
        ...row,
        client_updated_at: updatedAt,
        updated_at: now,
      })),
      { onConflict: 'user_id,book,chapter,verse' },
    );
    rethrowPostgrest(error);
    return;
  }

  if (scope === 'quiz_stats') {
    const snapshot = buildQuizStatsSnapshot(storage);
    if (!snapshot) {
      return;
    }

    const { error } = await client.from('user_quiz_stats').upsert({
      user_id: userId,
      ...snapshot,
      client_updated_at: updatedAt,
      updated_at: new Date().toISOString(),
    });
    rethrowPostgrest(error);
    return;
  }

  if (scope === 'streak_state') {
    const snapshot = buildStreakStateSnapshot(storage);
    if (!snapshot) {
      return;
    }

    const { error } = await client.from('user_streak_state').upsert({
      user_id: userId,
      ...snapshot,
      client_updated_at: updatedAt,
      updated_at: new Date().toISOString(),
    });
    rethrowPostgrest(error);
    return;
  }

  if (scope === 'reward_state') {
    const snapshot = buildRewardStateSnapshot(storage);
    if (!snapshot) {
      return;
    }

    const { error } = await client.from('user_reward_state').upsert({
      user_id: userId,
      settings: snapshot.settings,
      state: snapshot.state,
      vitrail: snapshot.vitrail,
      cards: snapshot.cards,
      client_updated_at: updatedAt,
      updated_at: new Date().toISOString(),
    });
    if (isMissingSchemaTableError(error, 'user_reward_state')) {
      warnMissingDedicatedTable('user_reward_state');
      return;
    }

    rethrowPostgrest(error);
  }
}

export async function pushEventSyncOperation(operation: EventSyncOperation): Promise<void> {
  const client = getClient();
  const { eventType, payload, userId } = operation;

  if (eventType === 'verse_review') {
    const { error } = await client.from('verse_review_events').insert({ user_id: userId, ...payload });
    rethrowPostgrest(error);
    return;
  }

  if (eventType === 'quiz_attempt') {
    const { error } = await client.from('quiz_attempts').insert({ user_id: userId, ...payload });
    rethrowPostgrest(error);
    return;
  }

  if (eventType === 'streak_event') {
    const { error } = await client.from('streak_events').insert({ user_id: userId, ...payload });
    rethrowPostgrest(error);
    return;
  }

  if (eventType === 'reward_event') {
    const { error } = await client.from('reward_events').insert({ user_id: userId, ...payload });
    if (isMissingSchemaTableError(error, 'reward_events')) {
      warnMissingDedicatedTable('reward_events');
      return;
    }

    rethrowPostgrest(error);
    return;
  }

  throw new Error(`Unsupported event type: ${eventType}`);
}

export function logUserStateSyncError(context: string, error: unknown): void {
  console.warn(`[UserStateSync] ${context}: ${describeError(error)}`);
}
