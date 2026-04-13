import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { sendInstantNotification } from '../../../../utils/notifications';
import { t } from '../../../../constants/translations';
import { isUuid } from '../../../lib/authValidation';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { describeError, isNetworkFetchFailure } from '../../../../utils/errorLogging';
import { fetchLeaderboardEntries } from '../services/leaderboardService';
import {
  acceptFriendRequest as acceptFriendRequestRequest,
  acceptQuizChallengeRequest as acceptQuizChallengeRequestRequest,
  acceptXpChallengeRequest,
  cancelQuizChallengeRequest as cancelQuizChallengeRequestRequest,
  fetchFriendIds,
  fetchIncomingFriendRequests,
  fetchIncomingQuizChallengeRequests,
  fetchIncomingXpChallengeRequests,
  rejectFriendRequest as rejectFriendRequestRequest,
  rejectQuizChallengeRequest as rejectQuizChallengeRequestRequest,
  rejectXpChallengeRequest,
  removeFriend as removeFriendRequest,
  sendFriendRequest as sendFriendRequestRequest,
  sendQuizChallengeRequest as sendQuizChallengeRequestRequest,
  sendXpChallengeRequest,
} from '../services/socialService';
import type {
  FriendRequest,
  IncomingChallengeRequest,
  IncomingQuizChallengeRequest,
  LeaderboardEntry,
  SendQuizChallengeParams,
} from '../types';

const invalidIdentifierError = 'Invalid identifier';

export function useSocialState(userId: string | undefined, accessToken: string | undefined, uiLanguage = 'en') {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingChallengeRequests, setIncomingChallengeRequests] = useState<IncomingChallengeRequest[]>([]);
  const [incomingQuizChallengeRequests, setIncomingQuizChallengeRequests] = useState<IncomingQuizChallengeRequest[]>([]);

  const canRunAuthenticatedQueries = useMemo(
    () => isSupabaseConfigured && Boolean(userId) && Boolean(accessToken),
    [accessToken, userId],
  );

  const resetSocialState = useCallback(() => {
    setFriends([]);
    setIncomingFriendRequests([]);
    setIncomingChallengeRequests([]);
    setIncomingQuizChallengeRequests([]);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!canRunAuthenticatedQueries) {
      setLeaderboard([]);
      setLeaderboardLoading(false);
      return;
    }

    setLeaderboardLoading(true);
    try {
      setLeaderboard(await fetchLeaderboardEntries());
    } catch (error) {
      if (isNetworkFetchFailure(error)) {
        console.warn('[AuthSocial] Unable to refresh leaderboard because the Supabase API is unreachable:', describeError(error));
        return;
      }

      console.error('[AuthSocial] Leaderboard error:', describeError(error));
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [canRunAuthenticatedQueries]);

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!canRunAuthenticatedQueries || !userId) {
      resetSocialState();
      return;
    }

    try {
      const [friendIds, requests] = await Promise.all([
        fetchFriendIds(userId).catch((error: any) => {
          if (!error?.message?.includes('schema cache')) {
            console.error('[AuthSocial] Friends fetch error:', describeError(error));
          }
          return [];
        }),
        fetchIncomingFriendRequests(userId).catch((error: any) => {
          if (!error?.message?.includes('schema cache')) {
            console.error('[AuthSocial] Friend requests fetch error:', describeError(error));
          }
          return [];
        }),
      ]);

      setFriends(friendIds);
      setIncomingFriendRequests(requests);
    } catch (error) {
      console.error('[AuthSocial] Friends/requests exception:', describeError(error));
    }
  }, [canRunAuthenticatedQueries, resetSocialState, userId]);

  const fetchChallengeRequests = useCallback(async () => {
    if (!canRunAuthenticatedQueries || !userId) {
      setIncomingChallengeRequests([]);
      return;
    }

    try {
      setIncomingChallengeRequests(await fetchIncomingXpChallengeRequests(userId));
    } catch (error) {
      console.error('[AuthSocial] Challenge requests fetch error:', describeError(error));
      setIncomingChallengeRequests([]);
    }
  }, [canRunAuthenticatedQueries, userId]);

  const fetchQuizChallengeRequests = useCallback(async () => {
    if (!canRunAuthenticatedQueries || !userId) {
      setIncomingQuizChallengeRequests([]);
      return;
    }

    try {
      setIncomingQuizChallengeRequests(await fetchIncomingQuizChallengeRequests(userId));
    } catch (error) {
      console.error('[AuthSocial] Quiz challenge requests fetch error:', describeError(error));
      setIncomingQuizChallengeRequests([]);
    }
  }, [canRunAuthenticatedQueries, userId]);

  const refreshSocialData = useCallback(async () => {
    if (!canRunAuthenticatedQueries || !userId) {
      resetSocialState();
      return;
    }

    await Promise.all([
      fetchFriendsAndRequests(),
      fetchChallengeRequests(),
      fetchQuizChallengeRequests(),
    ]);
  }, [canRunAuthenticatedQueries, fetchChallengeRequests, fetchFriendsAndRequests, fetchQuizChallengeRequests, resetSocialState, userId]);

  useEffect(() => {
    if (!userId) {
      resetSocialState();
      return;
    }

    void refreshSocialData();
  }, [refreshSocialData, resetSocialState, userId]);

  useEffect(() => {
    if (!canRunAuthenticatedQueries || !userId) {
      return undefined;
    }

    // Debounce helpers – a single real-time event can fire multiple times in
    // quick succession (e.g. INSERT + UPDATE from a trigger).  Debouncing
    // collapses these into one fetch, cutting Supabase queries significantly.
    const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
    const debounce = (key: string, fn: () => void, ms = 800) => {
      if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
      debounceTimers[key] = setTimeout(fn, ms);
    };

    // XP challenges – only listen for incoming requests (receiver_id).
    // The sender_id filter was removed because fetchChallengeRequests only
    // returns rows where receiver_id = userId, so sender-side events were
    // triggering a useless refetch.
    const challengeChannel = supabase
      .channel(`xp-challenge-requests-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xp_challenge_requests', filter: `receiver_id=eq.${userId}` }, (payload) => {
        debounce('xpChallenge', () => void fetchChallengeRequests());
        const next = payload.new as Record<string, unknown> | null;
        if (next?.status === 'pending') {
          void sendInstantNotification(
            t(uiLanguage, 'xpChallengeIncomingTitle'),
            t(uiLanguage, 'xpChallengeIncomingBody'),
            { requestId: typeof next.id === 'string' ? next.id : '' },
          );
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'xp_challenge_requests', filter: `receiver_id=eq.${userId}` }, () => {
        debounce('xpChallenge', () => void fetchChallengeRequests());
      })
      .subscribe();

    // Quiz challenges – same approach: only receiver_id filter.
    const quizChallengeChannel = supabase
      .channel(`quiz-challenge-requests-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_challenge_requests', filter: `receiver_id=eq.${userId}` }, (payload) => {
        debounce('quizChallenge', () => void fetchQuizChallengeRequests());
        const next = payload.new as Record<string, unknown> | null;
        if (next?.status === 'pending') {
          void sendInstantNotification(
            t(uiLanguage, 'quizChallengeIncomingTitle'),
            t(uiLanguage, 'quizChallengeIncomingBody'),
            { requestId: typeof next.id === 'string' ? next.id : '' },
          );
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_challenge_requests', filter: `receiver_id=eq.${userId}` }, () => {
        debounce('quizChallenge', () => void fetchQuizChallengeRequests());
      })
      .subscribe();

    // Friend requests – keep both sender and receiver filters because
    // fetchFriendsAndRequests also refreshes the friends list, which needs
    // to update when an outgoing request is accepted.
    const friendRequestChannel = supabase
      .channel(`friend-requests-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `sender_id=eq.${userId}` }, () => {
        debounce('friends', () => void fetchFriendsAndRequests());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${userId}` }, (payload) => {
        debounce('friends', () => void fetchFriendsAndRequests());
        const next = payload.new as Record<string, unknown> | null;
        if (next?.status === 'pending') {
          void sendInstantNotification(
            t(uiLanguage, 'friendRequestIncomingTitle'),
            t(uiLanguage, 'friendRequestIncomingBody'),
            { friendRequestId: typeof next.id === 'string' ? next.id : '' },
          );
        }
      })
      .subscribe();

    return () => {
      Object.values(debounceTimers).forEach(clearTimeout);
      void supabase.removeChannel(challengeChannel);
      void supabase.removeChannel(quizChallengeChannel);
      void supabase.removeChannel(friendRequestChannel);
    };
  }, [canRunAuthenticatedQueries, fetchChallengeRequests, fetchFriendsAndRequests, fetchQuizChallengeRequests, uiLanguage, userId]);

  // Refresh social data when the app returns to the foreground so that
  // any notifications or friend requests received while backgrounded
  // appear immediately without requiring a full restart.
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!canRunAuthenticatedQueries || !userId) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        void refreshSocialData();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [canRunAuthenticatedQueries, refreshSocialData, userId]);

  const sendFriendRequest = useCallback(async (receiverId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(receiverId)) {
      return { error: invalidIdentifierError };
    }
    if (receiverId === userId) {
      return { error: 'Cannot add yourself' };
    }
    if (friends.includes(receiverId)) {
      return { error: 'Already friends' };
    }

    const result = await sendFriendRequestRequest(userId, receiverId);
    if (!result.error) {
      await fetchFriendsAndRequests();
    }
    return result;
  }, [fetchFriendsAndRequests, friends, userId]);

  const acceptFriendRequest = useCallback(async (requestId: string, senderId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId) || !isUuid(senderId)) {
      return { error: invalidIdentifierError };
    }

    const result = await acceptFriendRequestRequest(userId, requestId, senderId);
    if (!result.error) {
      await fetchFriendsAndRequests();
    }
    return result;
  }, [fetchFriendsAndRequests, userId]);

  const rejectFriendRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await rejectFriendRequestRequest(userId, requestId);
    if (!result.error) {
      await fetchFriendsAndRequests();
    }
    return result;
  }, [fetchFriendsAndRequests, userId]);

  const removeFriend = useCallback(async (friendId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(friendId)) {
      return { error: invalidIdentifierError };
    }

    const result = await removeFriendRequest(userId, friendId);
    if (!result.error) {
      await fetchFriendsAndRequests();
    }
    return result;
  }, [fetchFriendsAndRequests, userId]);

  const sendChallengeRequest = useCallback(async (params: { receiverId: string; durationMinutes: number; senderUsername: string; receiverUsername: string }): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(params.receiverId)) {
      return { error: invalidIdentifierError };
    }
    if (params.receiverId === userId) {
      return { error: 'Cannot challenge yourself' };
    }

    return sendXpChallengeRequest(userId, params.receiverId, params.durationMinutes);
  }, [userId]);

  const acceptChallengeRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await acceptXpChallengeRequest(userId, requestId);
    if (!result.error) {
      await fetchChallengeRequests();
    }
    return result;
  }, [fetchChallengeRequests, userId]);

  const rejectChallengeRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await rejectXpChallengeRequest(userId, requestId);
    if (!result.error) {
      await fetchChallengeRequests();
    }
    return result;
  }, [fetchChallengeRequests, userId]);

  const sendQuizChallengeRequest = useCallback(async (params: SendQuizChallengeParams): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(params.receiverId)) {
      return { error: invalidIdentifierError };
    }
    if (params.receiverId === userId) {
      return { error: 'Cannot challenge yourself' };
    }

    return sendQuizChallengeRequestRequest(userId, params);
  }, [userId]);

  const acceptQuizChallengeRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await acceptQuizChallengeRequestRequest(userId, requestId);
    if (!result.error) {
      await fetchQuizChallengeRequests();
    }
    return result;
  }, [fetchQuizChallengeRequests, userId]);

  const rejectQuizChallengeRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await rejectQuizChallengeRequestRequest(userId, requestId);
    if (!result.error) {
      await fetchQuizChallengeRequests();
    }
    return result;
  }, [fetchQuizChallengeRequests, userId]);

  const cancelQuizChallengeRequest = useCallback(async (requestId: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }
    if (!isUuid(requestId)) {
      return { error: invalidIdentifierError };
    }

    const result = await cancelQuizChallengeRequestRequest(userId, requestId);
    if (!result.error) {
      await fetchQuizChallengeRequests();
    }
    return result;
  }, [fetchQuizChallengeRequests, userId]);

  return {
    leaderboard,
    leaderboardLoading,
    friends,
    incomingFriendRequests,
    incomingChallengeRequests,
    incomingQuizChallengeRequests,
    fetchLeaderboard,
    fetchChallengeRequests,
    fetchQuizChallengeRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    sendChallengeRequest,
    acceptChallengeRequest,
    rejectChallengeRequest,
    sendQuizChallengeRequest,
    acceptQuizChallengeRequest,
    rejectQuizChallengeRequest,
    cancelQuizChallengeRequest,
  };
}
