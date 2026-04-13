import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, MessageSquareDot } from 'lucide-react-native';

import type { ColorScheme } from '../../../../constants/colors';
import type { FeaturePoll, VoteCount } from '../../polls/pollService';
import {
  dismissPoll,
  fetchActivePoll,
  fetchVoteCounts,
  hasDismissedPoll,
  hasVotedOnPoll,
  isPollExpired,
  submitVote,
} from '../../polls/pollService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PollLabels {
  pollSectionEyebrow: string;
  pollVoteButtonLabel: string;
  pollVotesLabel: string;
  pollThanksMessage: string;
  pollErrorMessage: string;
  pollDismissLabel: string;
}

interface SettingsPollSectionProps {
  colors: ColorScheme;
  isFrench: boolean;
  labels: PollLabels;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPollSection({ colors, isFrench, labels }: SettingsPollSectionProps) {
  const [poll, setPoll] = useState<FeaturePoll | null | undefined>(undefined); // undefined = loading
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // ── Initial load ──────────────────────────────────────────────────────────

  const loadPoll = useCallback(async () => {
    try {
      const activePoll = await fetchActivePoll();

      if (activePoll) {
        const [voted, isDismissed] = await Promise.all([
          hasVotedOnPoll(activePoll.id),
          hasDismissedPoll(activePoll.id),
        ]);

        // Hide expired polls for users who haven't voted yet
        if (!voted && isPollExpired(activePoll)) {
          setPoll(null);
          return;
        }

        // Hide dismissed polls
        if (isDismissed) {
          setDismissed(true);
          setPoll(activePoll);
          return;
        }

        setPoll(activePoll);
        setAlreadyVoted(voted);
        if (voted) {
          const counts = await fetchVoteCounts(activePoll.id);
          setVoteCounts(counts);
        }
      } else {
        setPoll(null);
      }
    } catch {
      setPoll(null);
    }
  }, []);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  // ── Vote handler ──────────────────────────────────────────────────────────

  const handleVote = async (optionIndex: number) => {
    if (!poll || submitting) return;
    setSubmitting(true);

    try {
      const result = await submitVote(poll.id, optionIndex, poll.notify_url);

      if (result.success) {
        setVotedIndex(optionIndex);
        setAlreadyVoted(true);
        const counts = await fetchVoteCounts(poll.id);
        setVoteCounts(counts);
      } else if (result.alreadyVoted) {
        setAlreadyVoted(true);
        const counts = await fetchVoteCounts(poll.id);
        setVoteCounts(counts);
      } else {
        Alert.alert(
          labels.pollErrorMessage,
          isFrench
            ? 'Impossible d\'enregistrer ton vote. Vérifie ta connexion.'
            : 'Could not save your vote. Check your connection.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dismiss handler ───────────────────────────────────────────────────────

  const handleDismiss = async () => {
    if (!poll) return;
    await dismissPoll(poll.id);
    setDismissed(true);
  };

  // ── Guard clauses ─────────────────────────────────────────────────────────

  // Still loading
  if (poll === undefined) {
    return (
      <View style={[pollStyles.container, { borderColor: colors.border }]}>
        <View style={pollStyles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  // No active poll, or dismissed — render nothing so the settings page stays clean
  if (!poll || dismissed) return null;

  // ── Computed values ───────────────────────────────────────────────────────

  const title = isFrench ? poll.title_fr : poll.title_en;
  const description = isFrench ? poll.description_fr : poll.description_en;
  const totalVotes = voteCounts.reduce((sum, c) => sum + c.votes, 0);

  const getCount = (idx: number) =>
    voteCounts.find((c) => c.option_index === idx)?.votes ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[pollStyles.container, { borderColor: colors.primary + '40', backgroundColor: colors.cardBackground }]}>

      {/* Eyebrow */}
      <View style={pollStyles.eyebrowRow}>
        <MessageSquareDot color={colors.primary} size={15} />
        <Text style={[pollStyles.eyebrow, { color: colors.primary }]}>
          {labels.pollSectionEyebrow}
        </Text>
      </View>

      {/* Question */}
      <Text style={[pollStyles.question, { color: colors.text }]}>{title}</Text>

      {description ? (
        <Text style={[pollStyles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}

      {/* Options or results */}
      {alreadyVoted ? (
        // ── Results view ────────────────────────────────────────────────────
        <View style={pollStyles.resultsContainer}>
          {/* Thank-you banner */}
          <View style={[pollStyles.thanksBanner, { backgroundColor: colors.primary + '18' }]}>
            <CheckCircle2 color={colors.primary} size={15} />
            <Text style={[pollStyles.thanksText, { color: colors.primary }]}>
              {labels.pollThanksMessage}
            </Text>
          </View>

          {/* Bar chart */}
          {poll.options.map((option, idx) => {
            const count = getCount(idx);
            const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const label = isFrench ? option.fr : option.en;
            const isMyVote = votedIndex === idx;

            return (
              <View key={idx} style={pollStyles.resultRow}>
                <View style={pollStyles.resultHeader}>
                  <View style={pollStyles.resultLabelWrap}>
                    {isMyVote ? (
                      <CheckCircle2 color={colors.primary} size={13} style={{ marginRight: 5 }} />
                    ) : null}
                    <Text
                      style={[
                        pollStyles.resultLabel,
                        { color: isMyVote ? colors.primary : colors.text },
                        isMyVote && pollStyles.resultLabelBold,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  <Text style={[pollStyles.resultPercent, { color: colors.textSecondary }]}>
                    {percent}%
                  </Text>
                </View>
                <View style={[pollStyles.barTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      pollStyles.barFill,
                      {
                        width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` as `${number}%`,
                        backgroundColor: isMyVote ? colors.primary : colors.primary + '55',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}

          {/* Total count */}
          <Text style={[pollStyles.totalVotes, { color: colors.textTertiary }]}>
            {totalVotes} {labels.pollVotesLabel}
          </Text>
        </View>
      ) : (
        // ── Vote options ────────────────────────────────────────────────────
        <View style={pollStyles.optionsContainer}>
          {poll.options.map((option, idx) => {
            const label = isFrench ? option.fr : option.en;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  pollStyles.optionButton,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.background,
                    opacity: submitting ? 0.55 : 1,
                  },
                ]}
                onPress={() => handleVote(idx)}
                disabled={submitting}
                activeOpacity={0.72}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[pollStyles.optionText, { color: colors.primary }]}>{label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={pollStyles.dismissButton}
            onPress={handleDismiss}
            disabled={submitting}
            activeOpacity={0.6}
          >
            <Text style={[pollStyles.dismissText, { color: colors.textTertiary }]}>
              {labels.pollDismissLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pollStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  question: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: 2,
  },
  // ── Options ───────────────────────────────────────────────────────────────
  optionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  optionButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 2,
  },
  dismissText: {
    fontSize: 12,
  },
  // ── Results ───────────────────────────────────────────────────────────────
  resultsContainer: {
    marginTop: 12,
    gap: 10,
  },
  thanksBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  thanksText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultRow: {
    gap: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  resultLabel: {
    fontSize: 14,
    flex: 1,
  },
  resultLabelBold: {
    fontWeight: '700',
  },
  resultPercent: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 7,
    borderRadius: 4,
  },
  totalVotes: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
});
