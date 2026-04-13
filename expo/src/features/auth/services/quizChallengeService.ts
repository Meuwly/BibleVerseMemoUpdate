import { supabase } from '../../../lib/supabase';
import { normalizeQuizChallengeRecord, type QuizChallengeRecord, type QuizChallengeRow } from '../../quizChallenge';

const quizChallengeSelect = 'id, sender_id, receiver_id, status, category, question_count, created_at, accepted_at, started_at, completed_at, sender_score, sender_completed_at, receiver_score, receiver_completed_at, winner, sender:profiles!quiz_challenge_requests_sender_id_fkey(username), receiver:profiles!quiz_challenge_requests_receiver_id_fkey(username)';

export async function fetchQuizChallengeById(challengeId: string): Promise<QuizChallengeRecord | null> {
  const { data, error } = await supabase
    .from('quiz_challenge_requests')
    .select(quizChallengeSelect)
    .eq('id', challengeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizeQuizChallengeRecord(data as QuizChallengeRow);
}

export async function fetchLatestQuizChallengeForUser(userId: string): Promise<QuizChallengeRecord | null> {
  const { data, error } = await supabase
    .from('quiz_challenge_requests')
    .select(quizChallengeSelect)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .in('status', ['pending', 'accepted', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeQuizChallengeRecord(data as QuizChallengeRow) : null;
}

export async function submitQuizChallengeResult(params: {
  challengeId: string;
  userId: string;
  senderId: string;
  finalScore: number;
}): Promise<void> {
  const payload = params.senderId === params.userId
    ? { sender_score: params.finalScore }
    : { receiver_score: params.finalScore };

  const { error } = await supabase
    .from('quiz_challenge_requests')
    .update(payload)
    .eq('id', params.challengeId)
    .eq('status', 'accepted');

  if (error) {
    throw error;
  }
}
