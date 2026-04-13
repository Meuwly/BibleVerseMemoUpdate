import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import {
  buildFinishedChallengeFromRequest,
  normalizeChallengeRequestRecord,
  type ChallengeRequestRow,
} from '../../xpChallenge';

export async function fetchLatestCompletedXpChallenge(userId: string) {
  if (!isSupabaseConfigured || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('xp_challenge_requests')
    .select('id, sender_id, receiver_id, status, duration_minutes, created_at, accepted_at, started_at, ends_at, completed_at, challenger_start_xp, challenger_start_verses_completed, opponent_start_xp, opponent_start_verses_completed, challenger_final_xp, challenger_final_verses_completed, opponent_final_xp, opponent_final_verses_completed, sender:profiles!xp_challenge_requests_sender_id_fkey(username), receiver:profiles!xp_challenge_requests_receiver_id_fkey(username)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'completed')
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? buildFinishedChallengeFromRequest(normalizeChallengeRequestRecord(data as ChallengeRequestRow))
    : null;
}
