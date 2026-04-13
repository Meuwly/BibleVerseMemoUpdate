import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../../lib/supabase';
import type { LeaderboardEntry } from '../types';

const LEADERBOARD_CACHE_KEY = '@bvm/leaderboard_cache';
const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type LeaderboardCache = {
  entries: LeaderboardEntry[];
  fetchedAt: number;
};

export async function fetchLeaderboardEntries(limit = 50, forceRefresh = false): Promise<LeaderboardEntry[]> {
  if (!forceRefresh) {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_CACHE_KEY);
      if (raw) {
        const cached: LeaderboardCache = JSON.parse(raw);
        if (Date.now() - cached.fetchedAt < LEADERBOARD_CACHE_TTL_MS) {
          return cached.entries;
        }
      }
    } catch {
      // Ignore cache read errors – fall through to a fresh fetch
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, total_xp, current_streak, best_streak, verses_completed, quizzes_completed')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const entries = ((data as Omit<LeaderboardEntry, 'rank'>[]) ?? []).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  try {
    await AsyncStorage.setItem(
      LEADERBOARD_CACHE_KEY,
      JSON.stringify({ entries, fetchedAt: Date.now() } satisfies LeaderboardCache),
    );
  } catch {
    // Cache write failure is non-fatal
  }

  return entries;
}
