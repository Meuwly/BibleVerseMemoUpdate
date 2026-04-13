import { normalizeChallengeRequestRecord, MAX_XP_CHALLENGE_DURATION_MINUTES } from '../../xpChallenge';
import { normalizeQuizChallengeRecord } from '../../quizChallenge';
import { supabase } from '../../../lib/supabase';
import type {
  FriendRequest,
  IncomingChallengeRequest,
  IncomingChallengeRequestRow,
  IncomingQuizChallengeRequest,
  IncomingQuizChallengeRequestRow,
  SendQuizChallengeParams,
} from '../types';

export async function fetchFriendIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .limit(500);

  if (error) {
    throw error;
  }

  const friendIds = (data ?? []).map((row: { user_id: string; friend_id: string }) => (
    row.user_id === userId ? row.friend_id : row.user_id
  ));

  return Array.from(new Set(friendIds));
}

export async function fetchIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at, sender:profiles!friend_requests_sender_id_fkey(username)')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    status: row.status,
    created_at: row.created_at,
    sender_username: row.sender?.username,
  }));
}

export async function fetchIncomingXpChallengeRequests(userId: string): Promise<IncomingChallengeRequest[]> {
  const { data, error } = await supabase
    .from('xp_challenge_requests')
    .select('id, sender_id, receiver_id, status, duration_minutes, created_at, sender:profiles!xp_challenge_requests_sender_id_fkey(username), receiver:profiles!xp_challenge_requests_receiver_id_fkey(username)')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return ((data as IncomingChallengeRequestRow[]) ?? []).map(normalizeChallengeRequestRecord);
}

export async function fetchIncomingQuizChallengeRequests(userId: string): Promise<IncomingQuizChallengeRequest[]> {
  const { data, error } = await supabase
    .from('quiz_challenge_requests')
    .select('id, sender_id, receiver_id, status, category, question_count, created_at, sender:profiles!quiz_challenge_requests_sender_id_fkey(username), receiver:profiles!quiz_challenge_requests_receiver_id_fkey(username)')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return ((data as IncomingQuizChallengeRequestRow[]) ?? []).map(normalizeQuizChallengeRecord);
}

export async function sendFriendRequest(userId: string, receiverId: string): Promise<{ error: string | null }> {
  const { data: existingPending } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('sender_id', receiverId)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) {
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', existingPending.id)
      .eq('receiver_id', userId);

    if (updateError) {
      return { error: updateError.message };
    }

    const { error: friendshipError } = await supabase
      .from('friends')
      .upsert([
        { user_id: userId, friend_id: receiverId },
        { user_id: receiverId, friend_id: userId },
      ]);

    return { error: friendshipError?.message ?? null };
  }

  const { data: duplicate } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('sender_id', userId)
    .eq('receiver_id', receiverId)
    .eq('status', 'pending')
    .maybeSingle();

  if (duplicate) {
    return { error: 'Request already sent' };
  }

  const { error } = await supabase.from('friend_requests').insert({
    sender_id: userId,
    receiver_id: receiverId,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  return { error: error?.message ?? null };
}

export async function acceptFriendRequest(userId: string, requestId: string, senderId: string): Promise<{ error: string | null }> {
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .eq('receiver_id', userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: friendshipError } = await supabase
    .from('friends')
    .upsert([
      { user_id: userId, friend_id: senderId },
      { user_id: senderId, friend_id: userId },
    ]);

  return { error: friendshipError?.message ?? null };
}

export async function rejectFriendRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('receiver_id', userId);

  return { error: error?.message ?? null };
}

export async function removeFriend(userId: string, friendId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  return { error: error?.message ?? null };
}

export async function sendXpChallengeRequest(userId: string, receiverId: string, durationMinutes: number): Promise<{ error: string | null }> {
  const { data: duplicate, error: duplicateError } = await supabase
    .from('xp_challenge_requests')
    .select('id')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (duplicateError) {
    return { error: duplicateError.message };
  }
  if (duplicate) {
    return { error: 'challengeAlreadyInProgress' };
  }

  const normalizedDuration = Math.max(15, Math.min(durationMinutes, MAX_XP_CHALLENGE_DURATION_MINUTES));
  const { error } = await supabase.from('xp_challenge_requests').insert({
    sender_id: userId,
    receiver_id: receiverId,
    status: 'pending',
    duration_minutes: normalizedDuration,
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (error.message.includes('unique constraint') || error.message.includes('pair_active_unique')) {
      return { error: 'challengeAlreadyInProgress' };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function acceptXpChallengeRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('xp_challenge_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  return { error: error?.message ?? null };
}

export async function rejectXpChallengeRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('xp_challenge_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  return { error: error?.message ?? null };
}

export async function sendQuizChallengeRequest(userId: string, params: SendQuizChallengeParams): Promise<{ error: string | null }> {
  const { data: duplicate, error: duplicateError } = await supabase
    .from('quiz_challenge_requests')
    .select('id')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${params.receiverId}),and(sender_id.eq.${params.receiverId},receiver_id.eq.${userId})`)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (duplicateError) {
    return { error: duplicateError.message };
  }
  if (duplicate) {
    return { error: 'quizChallengeAlreadyInProgress' };
  }

  const { error } = await supabase.from('quiz_challenge_requests').insert({
    sender_id: userId,
    receiver_id: params.receiverId,
    status: 'pending',
    category: params.category,
    question_count: Math.max(1, Math.floor(params.questionCount)),
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (error.message.includes('unique constraint') || error.message.includes('pair_active_unique')) {
      return { error: 'quizChallengeAlreadyInProgress' };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function acceptQuizChallengeRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('quiz_challenge_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  return { error: error?.message ?? null };
}

export async function rejectQuizChallengeRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('quiz_challenge_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  return { error: error?.message ?? null };
}

export async function cancelQuizChallengeRequest(userId: string, requestId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('quiz_challenge_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('sender_id', userId)
    .in('status', ['pending', 'accepted']);

  return { error: error?.message ?? null };
}
