import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Award, BookOpen, Sparkles, Swords, Trophy } from 'lucide-react-native';

import { getColors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppProgress, useAppSettings } from '../../contexts/AppContext';
import { useAuthProfileState, useAuthSessionState, useAuthSocialState } from '../../contexts/AuthContext';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppCard } from '../../src/components/ui/AppCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { InlineMetric } from '../../src/components/ui/InlineMetric';
import ViewShot from '../../src/shims/react-native-view-shot';
import { getXpLevelInfo } from '../../src/features/xp';
import { LeaderboardSection } from '../../src/features/progress/components/LeaderboardSection';
import { ProgressOverviewSection } from '../../src/features/progress/components/ProgressOverviewSection';
import { ShareProgressCard } from '../../src/features/progress/components/ShareProgressCard';
import { useActiveXpChallenge } from '../../src/features/progress/hooks/useActiveXpChallenge';
import { styles } from '../../src/features/progress/styles';
import type { LeaderboardPlayer, ProgressOverviewStats } from '../../src/features/progress/types';
import type { ActiveXpChallenge } from '../../src/features/xpChallenge';
import { sharePngImage } from '../../src/utils/shareImage';

type ProgressTab = 'personal' | 'multiplayer';

export default function ProgressScreen() {
  const { uiLanguage, theme } = useAppSettings();
  const { progress, quizProgress, streakProgress, xpProgress } = useAppProgress();
  const { user, session } = useAuthSessionState();
  const { profile } = useAuthProfileState();
  const {
    leaderboard,
    leaderboardLoading,
    friends,
    incomingFriendRequests,
    fetchLeaderboard,
    sendFriendRequest,
    sendChallengeRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useAuthSocialState();
  const colors = getColors(theme);
  const router = useRouter();
  const shareCardRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProgressTab>('personal');

  const durationLabels = useMemo(() => ({
    dayShort: t(uiLanguage, 'dayShort'),
    hourShort: t(uiLanguage, 'hourShort'),
    minuteShort: t(uiLanguage, 'minuteShort'),
  }), [uiLanguage]);

  const totalVerses = progress.length;
  const versesStarted = progress.filter((p) => p.started).length;
  const versesCompleted = progress.filter((p) => p.completed).length;
  const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
  const correctGuesses = progress.reduce((sum, p) => sum + p.correctGuesses, 0);
  const accuracy = totalAttempts > 0 ? (correctGuesses / totalAttempts * 100).toFixed(1) : '0';
  const quizAccuracy = quizProgress.questionsAnswered > 0
    ? (quizProgress.correctAnswers / quizProgress.questionsAnswered * 100).toFixed(1)
    : '0';

  const totalXp = xpProgress.totalXp;
  const { currentLevel, xpIntoLevel, xpLevelSpan, xpProgressPercent } = getXpLevelInfo(totalXp);
  const streakMultiplier = 1 + Math.min(streakProgress.currentStreak, 10) * 0.05;
  const playerName = profile?.username ?? user?.email?.split('@')[0] ?? t(uiLanguage, 'xpChallengeYou');

  useFocusEffect(
    useCallback(() => {
      void fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  const { challengeViewModel, isChallengeBusy, loadActiveChallenge, finishChallenge, handleCancelChallenge, handleStartChallenge } = useActiveXpChallenge({
    userId: user?.id,
    accessToken: session?.access_token,
    userName: playerName,
    leaderboard,
    totalXp,
    versesCompleted,
    fetchLeaderboard,
    sendChallengeRequest,
    uiLanguage,
    t,
    durationLabels,
  });

  const overviewStats = useMemo<ProgressOverviewStats>(() => ({
    totalVerses,
    versesStarted,
    versesCompleted,
    totalAttempts,
    accuracy,
    totalXp,
    currentLevel,
    xpIntoLevel,
    xpLevelSpan,
    xpProgressPercent,
    streakMultiplier,
    currentStreak: streakProgress.currentStreak,
    bestStreak: streakProgress.bestStreak,
    quizzesCompleted: quizProgress.quizzesCompleted,
    bestQuizScore: quizProgress.bestScore,
    quizAccuracy,
  }), [
    accuracy,
    currentLevel,
    quizAccuracy,
    quizProgress.bestScore,
    quizProgress.quizzesCompleted,
    streakMultiplier,
    streakProgress.bestStreak,
    streakProgress.currentStreak,
    totalAttempts,
    totalVerses,
    totalXp,
    versesCompleted,
    versesStarted,
    xpIntoLevel,
    xpLevelSpan,
    xpProgressPercent,
  ]);

  const shareMetrics = useMemo(() => ([
    { key: 'totalXp', value: totalXp, label: t(uiLanguage, 'xpTotal') },
    { key: 'level', value: currentLevel, label: t(uiLanguage, 'xpLevelLabel') },
    { key: 'streak', value: streakProgress.currentStreak, label: t(uiLanguage, 'dailyStreak') },
    { key: 'started', value: versesStarted, label: t(uiLanguage, 'versesStarted') },
    { key: 'completed', value: versesCompleted, label: t(uiLanguage, 'versesCompleted') },
    { key: 'accuracy', value: `${accuracy}%`, label: t(uiLanguage, 'accuracy') },
    { key: 'quizzes', value: quizProgress.quizzesCompleted, label: t(uiLanguage, 'quizCompletedCount') },
    { key: 'bestScore', value: quizProgress.bestScore, label: t(uiLanguage, 'quizBestScore') },
    { key: 'quizAccuracy', value: `${quizAccuracy}%`, label: t(uiLanguage, 'quizAccuracy') },
    { key: 'attempts', value: totalAttempts, label: t(uiLanguage, 'totalAttempts') },
  ]), [
    accuracy,
    currentLevel,
    quizAccuracy,
    quizProgress.bestScore,
    quizProgress.quizzesCompleted,
    streakProgress.currentStreak,
    totalAttempts,
    totalXp,
    uiLanguage,
    versesCompleted,
    versesStarted,
  ]);

  const nextGoal = useMemo(() => {
    if (challengeViewModel) {
      return {
        eyebrow: t(uiLanguage, 'progressNextGoalLabel'),
        title: t(uiLanguage, 'progressGoalChallengeLiveTitle'),
        description: t(uiLanguage, 'progressGoalChallengeLiveBody'),
        actionLabel: t(uiLanguage, 'progressOpenMultiplayer'),
        action: () => setActiveTab('multiplayer'),
        tone: 'primary' as const,
      };
    }

    if (totalVerses === 0) {
      return {
        eyebrow: t(uiLanguage, 'progressNextGoalLabel'),
        title: t(uiLanguage, 'progressGoalFirstVerseTitle'),
        description: t(uiLanguage, 'progressGoalFirstVerseBody'),
        actionLabel: t(uiLanguage, 'progressStartLearning'),
        action: () => router.push('/(tabs)' as any),
        tone: 'primary' as const,
      };
    }

    if (streakProgress.currentStreak === 0) {
      return {
        eyebrow: t(uiLanguage, 'progressNextGoalLabel'),
        title: t(uiLanguage, 'progressGoalStreakTitle'),
        description: t(uiLanguage, 'progressGoalStreakBody'),
        actionLabel: t(uiLanguage, 'progressContinueLearning'),
        action: () => router.push('/(tabs)' as any),
        tone: 'warning' as const,
      };
    }

    if (friends.length === 0) {
      return {
        eyebrow: t(uiLanguage, 'progressNextGoalLabel'),
        title: t(uiLanguage, 'progressGoalFriendsTitle'),
        description: t(uiLanguage, 'progressGoalFriendsBody'),
        actionLabel: t(uiLanguage, 'progressOpenMultiplayer'),
        action: () => setActiveTab('multiplayer'),
        tone: 'success' as const,
      };
    }

    return {
      eyebrow: t(uiLanguage, 'progressNextGoalLabel'),
      title: t(uiLanguage, 'progressGoalLevelTitle'),
      description: t(uiLanguage, 'progressGoalLevelBody').replace('{count}', String(xpLevelSpan - xpIntoLevel)),
      actionLabel: t(uiLanguage, 'progressContinueLearning'),
      action: () => router.push('/(tabs)' as any),
      tone: 'primary' as const,
    };
  }, [challengeViewModel, friends.length, router, streakProgress.currentStreak, totalVerses, uiLanguage, xpIntoLevel, xpLevelSpan]);

  const shouldShowOpenMultiplayerQuickAction = nextGoal.actionLabel !== t(uiLanguage, 'progressOpenMultiplayer');
  const xpRemainingToNextLevel = Math.max(xpLevelSpan - xpIntoLevel, 0);
  const isFirstVerseGoal = totalVerses === 0 && !challengeViewModel;
  const heroCardTone = isFirstVerseGoal ? 'subtle' : nextGoal.tone;

  const handleShareProgress = async () => {
    if (isSharing) {
      return;
    }

    try {
      setIsSharing(true);
      const uri = await shareCardRef.current?.capture?.({ format: 'png', quality: 1 });

      if (!uri) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableGenerate'));
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableDevice'));
        return;
      }

      await sharePngImage(uri, t(uiLanguage, 'progressShareDialogTitle'));
    } catch {
      Alert.alert(t(uiLanguage, 'shareErrorTitle'), t(uiLanguage, 'shareErrorRetry'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleSendFriendRequest = async (entryId: string) => {
    const result = await sendFriendRequest(entryId);
    if (result.error) {
      Alert.alert(t(uiLanguage, 'error'), result.error);
      return;
    }

    Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'friendRequestSent'));
  };

  const handleAcceptFriendRequest = async (requestId: string, senderId: string) => {
    const result = await acceptFriendRequest(requestId, senderId);
    if (result.error) {
      Alert.alert(t(uiLanguage, 'error'), result.error);
      return;
    }

    Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'friendRequestAccepted'));
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    const result = await rejectFriendRequest(requestId);
    if (result.error) {
      Alert.alert(t(uiLanguage, 'error'), result.error);
      return;
    }

    Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'friendRequestRejected'));
  };

  const handleRemoveFriend = (entry: { id: string }) => {
    Alert.alert(
      t(uiLanguage, 'removeFriend'),
      t(uiLanguage, 'removeFriendConfirm'),
      [
        { text: t(uiLanguage, 'cancel'), style: 'cancel' },
        {
          text: t(uiLanguage, 'removeFriend'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await removeFriend(entry.id);
              if (result.error) {
                Alert.alert(t(uiLanguage, 'error'), result.error);
                return;
              }

              Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'friendRemoved'));
            })();
          },
        },
      ],
    );
  };

  const emptyProgress = totalVerses === 0 && quizProgress.quizzesCompleted === 0;

  const commonLeaderboardProps = {
    userId: user?.id,
    leaderboard,
    leaderboardLoading,
    friends,
    incomingFriendRequests,
    colors,
    labels: {
      leaderboard: t(uiLanguage, 'leaderboard'),
      leaderboardSubtitle: t(uiLanguage, 'progressSocialSubtitle'),
      duelsTitle: t(uiLanguage, 'progressChallengesTitle'),
      duelsSubtitle: t(uiLanguage, 'progressChallengesSubtitle'),
      loading: t(uiLanguage, 'loading'),
      leaderboardEmpty: t(uiLanguage, 'leaderboardEmpty'),
      searchByUsername: t(uiLanguage, 'searchByUsername'),
      friendTag: t(uiLanguage, 'friendTag'),
      addFriend: t(uiLanguage, 'addFriend'),
      xpTotal: t(uiLanguage, 'xpTotal'),
      dailyStreak: t(uiLanguage, 'dailyStreak'),
      bestDailyStreak: t(uiLanguage, 'bestDailyStreak'),
      versesCompleted: t(uiLanguage, 'versesCompleted'),
      quizCompletedCount: t(uiLanguage, 'quizCompletedCount'),
      friendStatsTitle: t(uiLanguage, 'friendStatsTitle'),
      friendGamesPlayed: t(uiLanguage, 'friendGamesPlayed'),
      friendWins: t(uiLanguage, 'friendWins'),
      friendLosses: t(uiLanguage, 'friendLosses'),
      removeFriend: t(uiLanguage, 'removeFriend'),
      friendRequests: t(uiLanguage, 'friendRequests'),
      accept: t(uiLanguage, 'accept'),
      decline: t(uiLanguage, 'decline'),
      xpChallengeCardTitle: t(uiLanguage, 'xpChallengeCardTitle'),
      xpChallengeCardBody: t(uiLanguage, 'xpChallengeCardBody'),
      xpChallengeAlreadyRunning: t(uiLanguage, 'xpChallengeAlreadyRunning'),
      xpChallengeLaunch: t(uiLanguage, 'xpChallengeLaunch'),
      xpChallengeLiveTitle: t(uiLanguage, 'xpChallengeLiveTitle'),
      xpChallengeVerseRace: t(uiLanguage, 'xpChallengeVerseRace'),
      xpChallengeVersesCompletedDuring: t(uiLanguage, 'xpChallengeVersesCompletedDuring'),
      xpChallengeProgressHint: t(uiLanguage, 'xpChallengeProgressHint'),
      xpChallengeCancel: t(uiLanguage, 'xpChallengeCancel'),
      xpChallengeFinishNow: t(uiLanguage, 'xpChallengeFinishNow'),
      xpChallengeSeeWinner: t(uiLanguage, 'xpChallengeSeeWinner'),
      selectFriendForChallenge: t(uiLanguage, 'progressChallengePickFriend'),
      selectedFriendDetails: t(uiLanguage, 'progressSelectedFriendDetails'),
    },
    durationLabels,
    activeChallengeViewModel: challengeViewModel,
    isChallengeBusy,
    onRefreshLeaderboard: () => {
      void fetchLeaderboard();
      void loadActiveChallenge();
    },
    onSendFriendRequest: (entryId: string) => void handleSendFriendRequest(entryId),
    onAcceptFriendRequest: (requestId: string, senderId: string) => void handleAcceptFriendRequest(requestId, senderId),
    onRejectFriendRequest: (requestId: string) => void handleRejectFriendRequest(requestId),
    onRemoveFriend: handleRemoveFriend,
    onStartChallenge: (entry: LeaderboardPlayer, durationMinutes: number, onSuccess?: () => void) => void handleStartChallenge(entry, durationMinutes, onSuccess),
    onCancelChallenge: handleCancelChallenge,
    onFinishChallenge: (challenge: ActiveXpChallenge) => void finishChallenge(challenge),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}> 
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'progress')}</Text>
        </View>
        <View style={styles.headerActions}>
          <AppButton
            colors={colors}
            label={t(uiLanguage, 'rewardVitrailTitle')}
            variant="secondary"
            icon={Sparkles}
            onPress={() => router.push('/vitrail' as any)}
          />
          <AppButton
            colors={colors}
            label={t(uiLanguage, 'shareProgressImage')}
            variant="secondary"
            icon={Award}
            onPress={() => void handleShareProgress()}
          />
        </View>
      </View>

      <ShareProgressCard
        colors={colors}
        title={t(uiLanguage, 'progressShareTitle')}
        subtitle={t(uiLanguage, 'progressShareSubtitle')}
        metrics={shareMetrics}
        shareCardRef={shareCardRef}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.tabRow}>
            {[
              { key: 'personal' as const, icon: Trophy, title: t(uiLanguage, 'progressTabPersonal'), count: `${versesCompleted}` },
              { key: 'multiplayer' as const, icon: Swords, title: t(uiLanguage, 'progressTabMultiplayer'), count: `${friends.length}${challengeViewModel ? '+1' : ''}` },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '12' : colors.cardBackground,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon color={isActive ? colors.primary : colors.textSecondary} size={18} />
                  <Text style={[styles.tabButtonText, { color: isActive ? colors.primary : colors.text }]}>{tab.title}</Text>
                  <Text style={[styles.tabButtonSubtext, { color: colors.textSecondary }]}>{tab.count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppCard
            colors={colors}
            tone={heroCardTone}
            style={[
              styles.heroCard,
              {
                borderColor: 'transparent',
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                backgroundColor: isFirstVerseGoal ? colors.primary + '08' : colors.cardBackground,
              },
            ]}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroTextBlock}>
                <Text style={[styles.heroEyebrow, { color: colors.primary }]}>{nextGoal.eyebrow}</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>{nextGoal.title}</Text>
                <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{nextGoal.description}</Text>
              </View>

              <View
                style={[
                  styles.heroLevelBadge,
                  {
                    backgroundColor: isFirstVerseGoal ? colors.primary + '0F' : colors.cardBackground + 'B8',
                    borderColor: isFirstVerseGoal ? colors.primary + '2E' : colors.primary + '2E',
                  },
                ]}
              >
                <Text style={[styles.heroLevelBadgeLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'xpLevelLabel')}</Text>
                <Text style={[styles.heroLevelBadgeValue, { color: colors.text }]}>Lv {currentLevel}</Text>
              </View>
            </View>

            <View
                style={[
                  styles.heroProgressPanel,
                  {
                    backgroundColor: isFirstVerseGoal ? colors.primary + '0B' : 'transparent',
                    borderColor: isFirstVerseGoal ? colors.primary + '28' : colors.primary + '24',
                  },
                ]}
              >
              <View style={styles.heroProgressHeader}>
                <Text style={[styles.heroProgressLabel, { color: colors.text }]}>{t(uiLanguage, 'xpNextLevel')}</Text>
                <Text style={[styles.heroProgressValue, { color: colors.primary }]}>{xpRemainingToNextLevel} XP</Text>
              </View>
              <View style={[styles.heroProgressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.heroProgressFill,
                    {
                      width: `${Math.max(xpProgressPercent, 6)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.heroProgressHint, { color: colors.textSecondary }]}>
                {xpIntoLevel} / {xpLevelSpan} XP
              </Text>
            </View>

            <View style={styles.heroMetricsRow}>
              <View style={[styles.heroMetricTile, { backgroundColor: 'transparent', borderColor: colors.primary + (isFirstVerseGoal ? '26' : '22') }]}>
                <InlineMetric colors={colors} label={t(uiLanguage, 'xpTotal')} value={totalXp} emphasis="primary" />
              </View>
              <View style={[styles.heroMetricTile, { backgroundColor: 'transparent', borderColor: colors.warning + (isFirstVerseGoal ? '26' : '22') }]}>
                <InlineMetric colors={colors} label={t(uiLanguage, 'dailyStreak')} value={streakProgress.currentStreak} emphasis="warning" />
              </View>
              <View style={[styles.heroMetricTile, { backgroundColor: 'transparent', borderColor: colors.success + (isFirstVerseGoal ? '26' : '22') }]}>
                <InlineMetric colors={colors} label={t(uiLanguage, 'versesCompleted')} value={versesCompleted} emphasis="success" />
              </View>
            </View>

            <View style={styles.quickActionRow}>
              <AppButton colors={colors} label={nextGoal.actionLabel} onPress={nextGoal.action} icon={BookOpen} />
              {shouldShowOpenMultiplayerQuickAction ? (
                <AppButton
                  colors={colors}
                  label={t(uiLanguage, 'progressOpenMultiplayer')}
                  onPress={() => setActiveTab('multiplayer')}
                  icon={Swords}
                  variant="secondary"
                />
              ) : null}
            </View>
          </AppCard>

          {activeTab === 'personal' ? (
            emptyProgress ? (
              <EmptyState
                colors={colors}
                icon={BookOpen}
                title={t(uiLanguage, 'progressEmptyTitle')}
                description={t(uiLanguage, 'progressEmptyBody')}
              />
            ) : (
              <>
                <ProgressOverviewSection
                  colors={colors}
                  stats={overviewStats}
                  labels={{
                    progressOverviewTitle: t(uiLanguage, 'progressOverviewTitle'),
                    progressOverviewSubtitle: t(uiLanguage, 'progressOverviewSubtitle'),
                    xpTotal: t(uiLanguage, 'xpTotal'),
                    xpLevelLabel: t(uiLanguage, 'xpLevelLabel'),
                    xpNextLevel: t(uiLanguage, 'xpNextLevel'),
                    xpStreakBonus: t(uiLanguage, 'xpStreakBonus'),
                    dailyStreak: t(uiLanguage, 'dailyStreak'),
                    bestDailyStreak: t(uiLanguage, 'bestDailyStreak'),
                    totalVerses: t(uiLanguage, 'totalVerses'),
                    versesStarted: t(uiLanguage, 'versesStarted'),
                    versesCompleted: t(uiLanguage, 'versesCompleted'),
                    accuracy: t(uiLanguage, 'accuracy'),
                    totalAttempts: t(uiLanguage, 'totalAttempts'),
                    quizCompletedCount: t(uiLanguage, 'quizCompletedCount'),
                    quizBestScore: t(uiLanguage, 'quizBestScore'),
                    quizAccuracy: t(uiLanguage, 'quizAccuracy'),
                  }}
                />
              </>
            )
          ) : null}

          {activeTab === 'multiplayer' ? <LeaderboardSection {...commonLeaderboardProps} mode="multiplayer" /> : null}
        </View>
      </ScrollView>
    </View>
  );
}
