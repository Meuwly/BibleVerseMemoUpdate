import { supabase } from '../../../lib/supabase';
import type { LeaderboardEntry } from '../types';

export async function fetchLeaderboardEntries(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, total_xp, current_streak, best_streak, verses_completed, quizzes_completed')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data as Omit<LeaderboardEntry, 'rank'>[]) ?? []).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
