import { supabase } from '../../../lib/supabase';
import { normalizeUsernameInput, validateUsername } from '../../../lib/authValidation';
import type { SyncProgressPayload, UserProfile } from '../types';

export function sanitizeProgressPayload(data: SyncProgressPayload): SyncProgressPayload {
  return {
    totalXp: Math.max(0, Math.floor(Number.isFinite(data.totalXp) ? data.totalXp : 0)),
    currentStreak: Math.max(0, Math.floor(Number.isFinite(data.currentStreak) ? data.currentStreak : 0)),
    bestStreak: Math.max(0, Math.floor(Number.isFinite(data.bestStreak) ? data.bestStreak : 0)),
    versesCompleted: Math.max(0, Math.floor(Number.isFinite(data.versesCompleted) ? data.versesCompleted : 0)),
    quizzesCompleted: Math.max(0, Math.floor(Number.isFinite(data.quizzesCompleted) ? data.quizzesCompleted : 0)),
  };
}

export async function fetchProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, total_xp, current_streak, best_streak, verses_completed, quizzes_completed, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return (data as UserProfile | null) ?? null;
}

export async function createProfileForUser(userId: string, username: string): Promise<void> {
  const normalizedUsername = normalizeUsernameInput(username);
  await supabase.from('profiles').upsert({
    id: userId,
    username: normalizedUsername,
    total_xp: 0,
    current_streak: 0,
    best_streak: 0,
    verses_completed: 0,
    quizzes_completed: 0,
    updated_at: new Date().toISOString(),
  });
}

export async function syncProfileProgress(data: SyncProgressPayload): Promise<UserProfile | null> {
  const safeData = sanitizeProgressPayload(data);
  const { data: syncedProfile, error } = await supabase.rpc('sync_profile_progress', {
    p_total_xp: safeData.totalXp,
    p_current_streak: safeData.currentStreak,
    p_best_streak: safeData.bestStreak,
    p_verses_completed: safeData.versesCompleted,
    p_quizzes_completed: safeData.quizzesCompleted,
  });

  if (error) {
    throw error;
  }

  return (syncedProfile as UserProfile | null) ?? null;
}

export async function ensureUsernameAvailable(username: string, excludedUserId?: string): Promise<boolean> {
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', normalizeUsernameInput(username));

  if (excludedUserId) {
    query = query.neq('id', excludedUserId);
  }

  const { data } = await query.maybeSingle();
  return !data;
}

export async function updateProfileUsername(userId: string, username: string): Promise<UserProfile | null> {
  const normalizedUsername = normalizeUsernameInput(username);
  const usernameError = validateUsername(normalizedUsername);
  if (usernameError) {
    throw new Error(usernameError);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: normalizedUsername, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  return fetchProfileByUserId(userId);
}
