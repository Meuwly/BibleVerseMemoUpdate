import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';
import {
  buildActiveChallengeFromRequest,
  buildFinishedChallengeFromRequest,
  clearActiveXpChallenge,
  clearLastXpChallengeResult,
  formatXpChallengeDuration,
  loadStoredActiveXpChallenge,
  normalizeChallengeRequestRecord,
  saveActiveXpChallenge,
  saveLastXpChallengeResult,
  type ActiveXpChallenge,
  type ChallengeLiveSnapshot,
  type ChallengeRequestRow,
} from '@/src/features/xpChallenge';
import type { LeaderboardPlayer } from '../types';
import { describeError, isNetworkFetchFailure } from '@/utils/errorLogging';

type DurationLabels = {
  dayShort: string;
  hourShort: string;
  minuteShort: string;
};

type Params = {
  userId?: string;
  accessToken?: string;
  userName: string;
  leaderboard: LeaderboardPlayer[];
  totalXp: number;
  versesCompleted: number;
  fetchLeaderboard: () => Promise<void>;
  sendChallengeRequest: (params: { receiverId: string; durationMinutes: number; senderUsername: string; receiverUsername: string }) => Promise<{ error: string | null }>;
  uiLanguage: string;
  t: (language: string, key: string) => string;
  durationLabels: DurationLabels;
};

function formatCountdown(ms: number, labels: DurationLabels): string {
  if (ms <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}${labels.dayShort} ${hours.toString().padStart(2, '0')}${labels.hourShort} ${minutes.toString().padStart(2, '0')}${labels.minuteShort}`;
  }

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function useActiveXpChallenge({
  userId,
  accessToken,
  userName,
  leaderboard,
  totalXp,
  versesCompleted,
  fetchLeaderboard,
  sendChallengeRequest,
  uiLanguage,
  t,
  durationLabels,
}: Params) {
  const router = useRouter();
  const canRunAuthenticatedQueries = isSupabaseConfigured && Boolean(userId) && Boolean(accessToken);
  const [activeChallenge, setActiveChallenge] = useState<ActiveXpChallenge | null>(null);
  const [challengeNow, setChallengeNow] = useState(Date.now());
  const [isChallengeBusy, setIsChallengeBusy] = useState(false);

  const loadActiveChallenge = useCallback(async () => {
    if (!canRunAuthenticatedQueries || !userId) {
      setActiveChallenge(null);
      await clearActiveXpChallenge();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('xp_challenge_requests')
        .select('id, sender_id, receiver_id, status, duration_minutes, created_at, accepted_at, started_at, ends_at, challenger_start_xp, challenger_start_verses_completed, opponent_start_xp, opponent_start_verses_completed, sender:profiles!xp_challenge_requests_sender_id_fkey(username), receiver:profiles!xp_challenge_requests_receiver_id_fkey(username)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const nextChallenge = data ? buildActiveChallengeFromRequest(data as any) : null;
      setActiveChallenge(nextChallenge);

      if (nextChallenge) {
        await saveActiveXpChallenge(nextChallenge);
      } else {
        await clearActiveXpChallenge();
      }
    } catch (error) {
      if (isNetworkFetchFailure(error)) {
        console.warn('[Progress] Unable to refresh active challenge because the Supabase API is unreachable:', describeError(error));
        const cachedChallenge = await loadStoredActiveXpChallenge();
        if (cachedChallenge) {
          setActiveChallenge(cachedChallenge);
        }
        return;
      }

      console.error('[Progress] Failed to load active challenge:', describeError(error));
      setActiveChallenge(null);
      await clearActiveXpChallenge();
    }
  }, [canRunAuthenticatedQueries, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadActiveChallenge();
    }, [loadActiveChallenge])
  );

  useEffect(() => {
    if (!canRunAuthenticatedQueries || !userId) {
      return undefined;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedLoad = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void loadActiveChallenge(), 800);
    };

    // Only listen to UPDATE events – the active-challenge query looks for
    // status='accepted', which only appears after a pending→accepted UPDATE.
    const challengeChannel = supabase
      .channel(`progress-xp-challenges-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'xp_challenge_requests', filter: `sender_id=eq.${userId}` }, debouncedLoad)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'xp_challenge_requests', filter: `receiver_id=eq.${userId}` }, debouncedLoad)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(challengeChannel);
    };
  }, [canRunAuthenticatedQueries, loadActiveChallenge, userId]);

  useEffect(() => {
    if (!activeChallenge) {
      return undefined;
    }

    const interval = setInterval(() => {
      setChallengeNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeChallenge]);

  useEffect(() => {
    if (!activeChallenge) {
      return undefined;
    }

    const interval = setInterval(() => {
      void fetchLeaderboard();
      void loadActiveChallenge();
    }, 300_000);

    return () => clearInterval(interval);
  }, [activeChallenge, fetchLeaderboard, loadActiveChallenge]);

  const isCurrentUserChallenger = activeChallenge?.challenger.id === userId;
  const challengerProfile = activeChallenge
    ? leaderboard.find((entry) => entry.id === activeChallenge.challenger.id) ?? null
    : null;
  const opponentProfile = activeChallenge
    ? leaderboard.find((entry) => entry.id === activeChallenge.opponent.id) ?? null
    : null;

  const challengerLiveSnapshot = useMemo<ChallengeLiveSnapshot>(() => {
    if (isCurrentUserChallenger) {
      return {
        xp: totalXp,
        versesCompleted,
      };
    }

    return {
      xp: challengerProfile?.total_xp ?? activeChallenge?.challenger.startXp ?? 0,
      versesCompleted: challengerProfile?.verses_completed ?? activeChallenge?.challenger.startVersesCompleted ?? 0,
    };
  }, [activeChallenge, challengerProfile, isCurrentUserChallenger, totalXp, versesCompleted]);

  const opponentLiveSnapshot = useMemo<ChallengeLiveSnapshot>(() => {
    if (!isCurrentUserChallenger && activeChallenge) {
      return {
        xp: totalXp,
        versesCompleted,
      };
    }

    return {
      xp: opponentProfile?.total_xp ?? activeChallenge?.opponent.startXp ?? 0,
      versesCompleted: opponentProfile?.verses_completed ?? activeChallenge?.opponent.startVersesCompleted ?? 0,
    };
  }, [activeChallenge, isCurrentUserChallenger, opponentProfile, totalXp, versesCompleted]);

  const challengeCountdownMs = activeChallenge
    ? Math.max(new Date(activeChallenge.endsAt).getTime() - challengeNow, 0)
    : 0;

  const finishChallenge = useCallback(async (challenge: ActiveXpChallenge) => {
    if (isChallengeBusy) {
      return;
    }

    try {
      setIsChallengeBusy(true);
      await fetchLeaderboard();
      const { data: completedRow, error } = await supabase
        .from('xp_challenge_requests')
        .update({ status: 'completed' })
        .eq('id', challenge.id)
        .select('id, sender_id, receiver_id, status, duration_minutes, created_at, accepted_at, started_at, ends_at, completed_at, challenger_start_xp, challenger_start_verses_completed, opponent_start_xp, opponent_start_verses_completed, challenger_final_xp, challenger_final_verses_completed, opponent_final_xp, opponent_final_verses_completed, sender:profiles!xp_challenge_requests_sender_id_fkey(username), receiver:profiles!xp_challenge_requests_receiver_id_fkey(username)')
        .maybeSingle();

      if (error) {
        throw error;
      }

      const result = completedRow
        ? buildFinishedChallengeFromRequest(normalizeChallengeRequestRecord(completedRow as ChallengeRequestRow))
        : null;

      if (!result) {
        throw new Error('Completed challenge result unavailable');
      }

      await saveLastXpChallengeResult(result);
      await clearActiveXpChallenge();
      setActiveChallenge(null);
      router.push('/xp-challenge-result' as any);
    } catch {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'xpChallengeFinishError'));
    } finally {
      setIsChallengeBusy(false);
    }
  }, [fetchLeaderboard, isChallengeBusy, router, t, uiLanguage]);

  useEffect(() => {
    if (!activeChallenge || challengeCountdownMs > 0) {
      return;
    }

    void finishChallenge(activeChallenge);
  }, [activeChallenge, challengeCountdownMs, finishChallenge]);

  const handleStartChallenge = useCallback(async (entry: LeaderboardPlayer, durationMinutes: number, onSuccess?: () => void) => {
    if (activeChallenge) {
      Alert.alert(t(uiLanguage, 'xpChallengeAlreadyActiveTitle'), t(uiLanguage, 'xpChallengeAlreadyActiveBody'));
      return;
    }

    try {
      await clearLastXpChallengeResult();
      const result = await sendChallengeRequest({
        receiverId: entry.id,
        durationMinutes,
        senderUsername: userName,
        receiverUsername: entry.username,
      });

      if (result.error) {
        const message = t(uiLanguage, result.error) || result.error;
        Alert.alert(t(uiLanguage, 'error'), message);
        return;
      }

      onSuccess?.();
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'xpChallengeRequestSent'));
    } catch {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'xpChallengeStartError'));
    }
  }, [activeChallenge, sendChallengeRequest, t, uiLanguage, userName]);

  const handleCancelChallenge = useCallback(() => {
    Alert.alert(
      t(uiLanguage, 'xpChallengeCancelTitle'),
      t(uiLanguage, 'xpChallengeCancelBody'),
      [
        { text: t(uiLanguage, 'cancel'), style: 'cancel' },
        {
          text: t(uiLanguage, 'reset'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await supabase
                .from('xp_challenge_requests')
                .update({ status: 'cancelled' })
                .eq('id', activeChallenge?.id ?? '');

              if (error) {
                Alert.alert(t(uiLanguage, 'error'), error.message);
                return;
              }

              await clearActiveXpChallenge();
              setActiveChallenge(null);
            })();
          },
        },
      ],
    );
  }, [activeChallenge?.id, t, uiLanguage]);

  const challengeViewModel = activeChallenge ? {
    challenge: activeChallenge,
    countdownLabel: formatCountdown(challengeCountdownMs, durationLabels),
    durationLabel: formatXpChallengeDuration(activeChallenge.durationMinutes, durationLabels),
    challengerVerseGain: Math.max(challengerLiveSnapshot.versesCompleted - activeChallenge.challenger.startVersesCompleted, 0),
    challengerXpGain: Math.max(challengerLiveSnapshot.xp - activeChallenge.challenger.startXp, 0),
    opponentVerseGain: Math.max(opponentLiveSnapshot.versesCompleted - activeChallenge.opponent.startVersesCompleted, 0),
    opponentXpGain: Math.max(opponentLiveSnapshot.xp - activeChallenge.opponent.startXp, 0),
    countdownMs: challengeCountdownMs,
  } : null;

  return {
    activeChallenge,
    challengeViewModel,
    isChallengeBusy,
    loadActiveChallenge,
    finishChallenge,
    handleCancelChallenge,
    handleStartChallenge,
  };
}
