import { useMemo, useState } from 'react';
import { Crown, Search, Swords, Users } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { AppCard } from '@/src/components/ui/AppCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { InlineMetric } from '@/src/components/ui/InlineMetric';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import type { ActiveXpChallenge } from '@/src/features/xpChallenge';
import { formatXpChallengeDuration } from '@/src/features/xpChallenge';
import { useFriendChallengeStats } from '../hooks/useFriendChallengeStats';
import { styles } from '../styles';
import type { LeaderboardPlayer } from '../types';
import { PlayerSearchInput } from './PlayerSearchInput';
import { SocialInteractionsSection } from './SocialInteractionsSection';
import { XpChallengesSection } from './XpChallengesSection';

type IncomingFriendRequest = {
  id: string;
  sender_id: string;
  sender_username?: string;
};

type Labels = {
  leaderboard: string;
  leaderboardSubtitle: string;
  duelsTitle: string;
  duelsSubtitle: string;
  loading: string;
  leaderboardEmpty: string;
  searchByUsername: string;
  friendTag: string;
  addFriend: string;
  xpTotal: string;
  dailyStreak: string;
  bestDailyStreak: string;
  versesCompleted: string;
  quizCompletedCount: string;
  friendStatsTitle: string;
  friendGamesPlayed: string;
  friendWins: string;
  friendLosses: string;
  removeFriend: string;
  friendRequests: string;
  accept: string;
  decline: string;
  xpChallengeCardTitle: string;
  xpChallengeCardBody: string;
  xpChallengeAlreadyRunning: string;
  xpChallengeLaunch: string;
  xpChallengeLiveTitle: string;
  xpChallengeVerseRace: string;
  xpChallengeVersesCompletedDuring: string;
  xpChallengeProgressHint: string;
  xpChallengeCancel: string;
  xpChallengeFinishNow: string;
  xpChallengeSeeWinner: string;
  selectFriendForChallenge: string;
  selectedFriendDetails: string;
};

type ActiveChallengeViewModel = {
  challenge: ActiveXpChallenge;
  countdownLabel: string;
  durationLabel: string;
  challengerVerseGain: number;
  challengerXpGain: number;
  opponentVerseGain: number;
  opponentXpGain: number;
  countdownMs: number;
};

type Props = {
  mode: 'social' | 'challenges' | 'multiplayer';
  userId?: string;
  leaderboard: LeaderboardPlayer[];
  leaderboardLoading: boolean;
  friends: string[];
  incomingFriendRequests: IncomingFriendRequest[];
  colors: ColorScheme;
  labels: Labels;
  durationLabels: { dayShort: string; hourShort: string; minuteShort: string };
  activeChallengeViewModel: ActiveChallengeViewModel | null;
  isChallengeBusy: boolean;
  onRefreshLeaderboard: () => void;
  onSendFriendRequest: (entryId: string) => void;
  onAcceptFriendRequest: (requestId: string, senderId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
  onRemoveFriend: (entry: LeaderboardPlayer) => void;
  onStartChallenge: (entry: LeaderboardPlayer, durationMinutes: number, onSuccess?: () => void) => void;
  onCancelChallenge: () => void;
  onFinishChallenge: (challenge: ActiveXpChallenge) => void;
};

export function LeaderboardSection({
  mode,
  userId,
  leaderboard,
  leaderboardLoading,
  friends,
  incomingFriendRequests,
  colors,
  labels,
  durationLabels,
  activeChallengeViewModel,
  isChallengeBusy,
  onRefreshLeaderboard,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  onStartChallenge,
  onCancelChallenge,
  onFinishChallenge,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [challengeDuration, setChallengeDuration] = useState(30);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const orderedLeaderboard = useMemo(() => [...leaderboard].sort((a, b) => {
    const aFriend = friends.includes(a.id);
    const bFriend = friends.includes(b.id);
    if (aFriend !== bFriend) {
      return aFriend ? -1 : 1;
    }

    return a.rank - b.rank;
  }), [friends, leaderboard]);

  const filteredLeaderboard = useMemo(() => orderedLeaderboard.filter((entry) => {
    if (!normalizedSearch) {
      return true;
    }

    return entry.username.toLowerCase().includes(normalizedSearch);
  }), [normalizedSearch, orderedLeaderboard]);

  const challengeCandidates = useMemo(
    () => filteredLeaderboard.filter((entry) => friends.includes(entry.id)),
    [filteredLeaderboard, friends],
  );

  const visibleEntries = mode === 'challenges' ? challengeCandidates : filteredLeaderboard;
  const selectedPlayer = leaderboard.find((entry) => entry.id === selectedPlayerId) ?? null;
  const isSelectedPlayerFriend = !!selectedPlayer && friends.includes(selectedPlayer.id);
  const { friendStats, friendStatsLoading } = useFriendChallengeStats({
    userId,
    friends,
    selectedPlayer,
  });

  const sectionTitle = mode === 'challenges' ? labels.duelsTitle : labels.leaderboard;
  const sectionSubtitle = mode === 'challenges' ? labels.duelsSubtitle : labels.leaderboardSubtitle;
  const sectionIcon = mode === 'challenges' ? Swords : Users;
  const sectionIconColor = mode === 'challenges' ? colors.primary : colors.warning;

  return (
    <View style={styles.sectionStack}>
      <AppCard colors={colors}>
        <View style={styles.sectionCardHeader}>
          <SectionHeader
            colors={colors}
            title={sectionTitle}
            subtitle={sectionSubtitle}
            icon={sectionIcon}
            iconColor={sectionIconColor}
          />
          <TouchableOpacity onPress={onRefreshLeaderboard} style={[styles.iconActionButton, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.leaderboardRefresh, { color: colors.primary }]}>↻</Text>
          </TouchableOpacity>
        </View>

        {(mode === 'social' || mode === 'multiplayer') ? (
          <SocialInteractionsSection
            incomingFriendRequests={incomingFriendRequests}
            colors={colors}
            labels={{ friendRequests: labels.friendRequests, accept: labels.accept, decline: labels.decline }}
            onAccept={onAcceptFriendRequest}
            onReject={onRejectFriendRequest}
          />
        ) : null}

        {(mode === 'challenges' || mode === 'multiplayer') ? (
          <XpChallengesSection
            colors={colors}
            labels={{
              xpChallengeCardTitle: labels.xpChallengeCardTitle,
              xpChallengeCardBody: labels.xpChallengeCardBody,
              xpChallengeAlreadyRunning: labels.xpChallengeAlreadyRunning,
              xpChallengeLaunch: labels.xpChallengeLaunch,
              xpChallengeLiveTitle: labels.xpChallengeLiveTitle,
              xpChallengeVerseRace: labels.xpChallengeVerseRace,
              xpChallengeVersesCompletedDuring: labels.xpChallengeVersesCompletedDuring,
              xpChallengeProgressHint: labels.xpChallengeProgressHint,
              xpChallengeCancel: labels.xpChallengeCancel,
              xpChallengeFinishNow: labels.xpChallengeFinishNow,
              xpChallengeSeeWinner: labels.xpChallengeSeeWinner,
              formatDuration: (duration) => formatXpChallengeDuration(duration, durationLabels),
            }}
            activeChallengeViewModel={activeChallengeViewModel}
            selectedPlayer={selectedPlayer}
            selectedPlayerIsFriend={isSelectedPlayerFriend}
            challengeDuration={challengeDuration}
            onChallengeDurationChange={setChallengeDuration}
            onRefresh={onRefreshLeaderboard}
            onCancelChallenge={onCancelChallenge}
            onFinishChallenge={onFinishChallenge}
            onStartChallenge={(entry) => onStartChallenge(entry, challengeDuration)}
            isChallengeBusy={isChallengeBusy}
          />
        ) : null}

        <View style={styles.directoryHeader}>
          <View>
            <Text style={[styles.directoryTitle, { color: colors.text }]}>
              {mode === 'challenges' ? labels.selectFriendForChallenge : labels.leaderboard}
            </Text>
            <Text style={[styles.directorySubtitle, { color: colors.textSecondary }]}>
              {mode === 'challenges' ? labels.duelsSubtitle : labels.searchByUsername}
            </Text>
          </View>
          <View style={[styles.directoryBadge, { backgroundColor: colors.primary + '14' }]}> 
            <Search color={colors.primary} size={14} />
            <Text style={[styles.directoryBadgeText, { color: colors.primary }]}>{visibleEntries.length}</Text>
          </View>
        </View>

        <PlayerSearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={labels.searchByUsername}
          colors={colors}
        />

        {leaderboardLoading ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{labels.loading}</Text>
        ) : visibleEntries.length === 0 ? (
          <EmptyState
            colors={colors}
            icon={mode === 'challenges' ? Swords : Crown}
            title={mode === 'challenges' ? labels.selectFriendForChallenge : labels.leaderboard}
            description={labels.leaderboardEmpty}
          />
        ) : (
          <View style={styles.leaderboardList}>
            {visibleEntries.map((entry) => {
              const isFriend = friends.includes(entry.id);
              const canAddFriend = (mode === 'social' || mode === 'multiplayer') && !!userId && entry.id !== userId && !isFriend;
              const isSelected = selectedPlayerId === entry.id;

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.leaderboardRow,
                    {
                      borderColor: isSelected ? colors.primary : isFriend ? colors.success : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary + '12'
                        : isFriend
                          ? colors.success + '0D'
                          : colors.background,
                    },
                  ]}
                  onPress={() => setSelectedPlayerId(entry.id)}
                >
                  <Text style={[styles.rankText, { color: colors.textSecondary }]}>#{entry.rank}</Text>
                  <View style={styles.playerMainInfo}>
                    <Text style={[styles.playerName, { color: isFriend ? colors.success : colors.text }]}> 
                      {entry.username}{isFriend ? ` • ${labels.friendTag}` : ''}
                    </Text>
                    <Text style={[styles.playerMeta, { color: colors.textSecondary }]}>XP {entry.total_xp} • 🔥 {entry.current_streak}</Text>
                  </View>
                  {canAddFriend ? (
                    <TouchableOpacity
                      onPress={() => onSendFriendRequest(entry.id)}
                      style={[styles.addFriendButton, { backgroundColor: colors.primary + '18' }]}
                    >
                      <Text style={[styles.addFriendButtonText, { color: colors.primary }]}>{labels.addFriend}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.selectionPill, { backgroundColor: (isSelected ? colors.primary : colors.border) + '18' }]}>
                      <Text style={[styles.selectionPillText, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                        {mode === 'challenges' ? labels.xpChallengeLaunch : '#' + entry.rank}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </AppCard>

      {selectedPlayer ? (
        <AppCard colors={colors} tone={mode === 'challenges' ? 'subtle' : 'default'}>
          <SectionHeader
            colors={colors}
            title={selectedPlayer.username}
            subtitle={labels.selectedFriendDetails}
            icon={mode === 'challenges' ? Swords : Users}
            iconColor={mode === 'challenges' ? colors.primary : colors.success}
          />

          <View style={styles.playerDetailsMetricsRow}>
            <InlineMetric colors={colors} label={labels.xpTotal} value={selectedPlayer.total_xp} emphasis="primary" />
            <InlineMetric colors={colors} label={labels.dailyStreak} value={selectedPlayer.current_streak} emphasis="warning" />
            <InlineMetric colors={colors} label={labels.bestDailyStreak} value={selectedPlayer.best_streak} emphasis="success" />
          </View>

          <View style={styles.playerDetailsMetricsRow}>
            <InlineMetric colors={colors} label={labels.versesCompleted} value={selectedPlayer.verses_completed} />
            <InlineMetric colors={colors} label={labels.quizCompletedCount} value={selectedPlayer.quizzes_completed} />
          </View>

          {isSelectedPlayerFriend && mode !== 'challenges' ? (
            <View style={[styles.friendInsightsCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <View style={styles.friendInsightsHeader}>
                <Text style={[styles.friendInsightsTitle, { color: colors.text }]}>{labels.friendStatsTitle}</Text>
                <TouchableOpacity
                  style={[styles.removeFriendButton, { borderColor: colors.error, backgroundColor: colors.error + '14' }]}
                  onPress={() => onRemoveFriend(selectedPlayer)}
                >
                  <Text style={[styles.removeFriendButtonText, { color: colors.error }]}>{labels.removeFriend}</Text>
                </TouchableOpacity>
              </View>

              {friendStatsLoading ? (
                <Text style={[styles.friendStatsLoading, { color: colors.textSecondary }]}>{labels.loading}</Text>
              ) : (
                <View style={styles.friendStatsGrid}>
                  <View style={[styles.friendStatItem, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}> 
                    <Text style={[styles.friendStatValue, { color: colors.primary }]}>{friendStats?.gamesPlayed ?? 0}</Text>
                    <Text style={[styles.friendStatLabel, { color: colors.textSecondary }]}>{labels.friendGamesPlayed}</Text>
                  </View>
                  <View style={[styles.friendStatItem, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}> 
                    <Text style={[styles.friendStatValue, { color: colors.success }]}>{friendStats?.wins ?? 0}</Text>
                    <Text style={[styles.friendStatLabel, { color: colors.textSecondary }]}>{labels.friendWins}</Text>
                  </View>
                  <View style={[styles.friendStatItem, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}> 
                    <Text style={[styles.friendStatValue, { color: colors.error }]}>{friendStats?.losses ?? 0}</Text>
                    <Text style={[styles.friendStatLabel, { color: colors.textSecondary }]}>{labels.friendLosses}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </AppCard>
      ) : null}
    </View>
  );
}
