import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { FriendChallengeStats, LeaderboardPlayer } from '../types';

const EMPTY_STATS: FriendChallengeStats = { gamesPlayed: 0, wins: 0, losses: 0 };

type Params = {
  userId?: string;
  friends: string[];
  selectedPlayer: LeaderboardPlayer | null;
};

export function useFriendChallengeStats({ userId, friends, selectedPlayer }: Params) {
  const [friendStats, setFriendStats] = useState<FriendChallengeStats | null>(null);
  const [friendStatsLoading, setFriendStatsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !selectedPlayer || !friends.includes(selectedPlayer.id)) {
      setFriendStats(null);
      setFriendStatsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadFriendStats = async () => {
      try {
        setFriendStatsLoading(true);
        const { data, error } = await supabase
          .from('xp_challenge_requests')
          .select('sender_id, winner')
          .eq('status', 'completed')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedPlayer.id}),and(sender_id.eq.${selectedPlayer.id},receiver_id.eq.${userId})`)
          .limit(100);

        if (error) {
          throw error;
        }

        const rows = ((data as { sender_id: string; winner: 'challenger' | 'opponent' | 'tie' | null }[]) ?? []);
        const stats = rows.reduce<FriendChallengeStats>((acc, row) => {
          acc.gamesPlayed += 1;

          const isSender = row.sender_id === userId;
          const currentUserWon =
            (isSender && row.winner === 'challenger')
            || (!isSender && row.winner === 'opponent');
          const currentUserLost =
            (isSender && row.winner === 'opponent')
            || (!isSender && row.winner === 'challenger');

          if (currentUserWon) {
            acc.wins += 1;
          }

          if (currentUserLost) {
            acc.losses += 1;
          }

          return acc;
        }, { ...EMPTY_STATS });

        if (!isCancelled) {
          setFriendStats(stats);
        }
      } catch (error) {
        console.error('[Progress] Failed to load friend challenge stats:', error);
        if (!isCancelled) {
          setFriendStats({ ...EMPTY_STATS });
        }
      } finally {
        if (!isCancelled) {
          setFriendStatsLoading(false);
        }
      }
    };

    void loadFriendStats();

    return () => {
      isCancelled = true;
    };
  }, [friends, selectedPlayer, userId]);

  return {
    friendStats,
    friendStatsLoading,
    resetFriendStats: () => setFriendStats({ ...EMPTY_STATS }),
  };
}
