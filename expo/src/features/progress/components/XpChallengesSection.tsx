import { Swords } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { XP_CHALLENGE_DURATION_OPTIONS, type ActiveXpChallenge } from '@/src/features/xpChallenge';
import { styles } from '../styles';
import type { LeaderboardPlayer } from '../types';

type Colors = {
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  background: string;
  success: string;
  error: string;
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

type Labels = {
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
  formatDuration: (duration: number) => string;
};

type Props = {
  colors: Colors;
  labels: Labels;
  activeChallengeViewModel: ActiveChallengeViewModel | null;
  selectedPlayer: LeaderboardPlayer | null;
  selectedPlayerIsFriend: boolean;
  challengeDuration: number;
  onChallengeDurationChange: (duration: number) => void;
  onRefresh: () => void;
  onCancelChallenge: () => void;
  onFinishChallenge: (challenge: ActiveXpChallenge) => void;
  onStartChallenge: (entry: LeaderboardPlayer) => void;
  isChallengeBusy: boolean;
};

export function XpChallengesSection({
  colors,
  labels,
  activeChallengeViewModel,
  selectedPlayer,
  selectedPlayerIsFriend,
  challengeDuration,
  onChallengeDurationChange,
  onRefresh,
  onCancelChallenge,
  onFinishChallenge,
  onStartChallenge,
  isChallengeBusy,
}: Props) {
  return (
    <>
      {activeChallengeViewModel && (
        <View style={[styles.challengeCard, { backgroundColor: colors.background, borderColor: colors.primary }]}> 
          <View style={styles.challengeHeaderRow}>
            <View style={styles.challengeTitleRow}>
              <Swords color={colors.primary} size={22} />
              <Text style={[styles.challengeTitle, { color: colors.text }]}>{labels.xpChallengeLiveTitle}</Text>
            </View>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={[styles.challengeRefresh, { color: colors.primary }]}>↻</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.challengeTimer, { color: colors.primary }]}>{activeChallengeViewModel.countdownLabel}</Text>
          <Text style={[styles.challengeTimerLabel, { color: colors.textSecondary }]}> 
            {labels.xpChallengeVerseRace} • {activeChallengeViewModel.durationLabel}
          </Text>

          <View style={styles.challengeDuelGrid}>
            <View style={[styles.challengePlayerCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
              <Text style={[styles.challengePlayerName, { color: colors.text }]}>{activeChallengeViewModel.challenge.challenger.username}</Text>
              <Text style={[styles.challengePlayerValue, { color: colors.primary }]}>+{activeChallengeViewModel.challengerVerseGain}</Text>
              <Text style={[styles.challengePlayerLabel, { color: colors.textSecondary }]}>{labels.xpChallengeVersesCompletedDuring}</Text>
              <Text style={[styles.challengePlayerXp, { color: colors.success }]}>+{activeChallengeViewModel.challengerXpGain} XP</Text>
            </View>

            <View style={[styles.challengePlayerCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
              <Text style={[styles.challengePlayerName, { color: colors.text }]}>{activeChallengeViewModel.challenge.opponent.username}</Text>
              <Text style={[styles.challengePlayerValue, { color: colors.primary }]}>+{activeChallengeViewModel.opponentVerseGain}</Text>
              <Text style={[styles.challengePlayerLabel, { color: colors.textSecondary }]}>{labels.xpChallengeVersesCompletedDuring}</Text>
              <Text style={[styles.challengePlayerXp, { color: colors.success }]}>+{activeChallengeViewModel.opponentXpGain} XP</Text>
            </View>
          </View>

          <Text style={[styles.challengeHint, { color: colors.textSecondary }]}>{labels.xpChallengeProgressHint}</Text>

          <View style={styles.challengeActionsRow}>
            <TouchableOpacity
              style={[styles.challengeSecondaryButton, { borderColor: colors.error }]}
              onPress={onCancelChallenge}
            >
              <Text style={[styles.challengeSecondaryButtonText, { color: colors.error }]}>{labels.xpChallengeCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.challengePrimaryButton, { backgroundColor: colors.primary }]}
              onPress={() => onFinishChallenge(activeChallengeViewModel.challenge)}
              disabled={isChallengeBusy}
            >
              <Text style={styles.challengePrimaryButtonText}>
                {activeChallengeViewModel.countdownMs > 0 ? labels.xpChallengeFinishNow : labels.xpChallengeSeeWinner}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {selectedPlayer && selectedPlayerIsFriend && (
        <View style={[styles.challengeSetupCard, { borderColor: colors.border, backgroundColor: colors.background }]}> 
          <View style={styles.challengeTitleRow}>
            <Swords color={colors.primary} size={20} />
            <Text style={[styles.challengeSetupTitle, { color: colors.text }]}>{labels.xpChallengeCardTitle}</Text>
          </View>
          <Text style={[styles.challengeSetupBody, { color: colors.textSecondary }]}>{labels.xpChallengeCardBody}</Text>

          <View style={styles.durationRow}>
            {XP_CHALLENGE_DURATION_OPTIONS.map((duration) => {
              const isSelected = challengeDuration === duration;
              return (
                <TouchableOpacity
                  key={duration}
                  style={[styles.durationChip, {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary + '15' : colors.background,
                  }]}
                  onPress={() => onChallengeDurationChange(duration)}
                >
                  <Text style={[styles.durationChipText, { color: isSelected ? colors.primary : colors.textSecondary }]}>{labels.formatDuration(duration)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.challengeLaunchButton, { backgroundColor: activeChallengeViewModel ? colors.border : colors.primary }]}
            onPress={() => onStartChallenge(selectedPlayer)}
            disabled={!!activeChallengeViewModel}
          >
            <Text style={styles.challengeLaunchButtonText}>
              {activeChallengeViewModel ? labels.xpChallengeAlreadyRunning : labels.xpChallengeLaunch}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
