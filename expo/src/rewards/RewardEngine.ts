import type { RewardPayload, RewardResult, RewardState, RewardCardsState, VitrailState, RewardMilestoneResult } from './types';
import { rewardCopy } from './rewardCopy';
import { getDayDifference, getDayKey, getMonthKey, getWeekKey, getMasteryStage, hashString, pickFromList, shouldTriggerSurprise } from './rules';
import { buildDetailLines } from './selectors';
import { loadRewardsData, saveRewardsData } from '../storage/rewardsRepo';
import { enqueueBusinessEvent } from '../features/app/services/userStateSync';

const sessionId = `session-${Date.now()}`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function updateStreak(state: RewardState, dayKey: string): RewardState {
  if (!state.lastActiveDayKey) {
    return { ...state, streakCount: 1, lastActiveDayKey: dayKey };
  }

  if (state.lastActiveDayKey === dayKey) {
    return state;
  }

  const diff = getDayDifference(state.lastActiveDayKey, dayKey);
  if (diff === 1) {
    return { ...state, streakCount: state.streakCount + 1, lastActiveDayKey: dayKey };
  }

  if (diff > 1 && state.graceDaysRemaining > 0) {
    const usedGrace = clamp(diff - 1, 1, state.graceDaysRemaining);
    return {
      ...state,
      graceDaysRemaining: state.graceDaysRemaining - usedGrace,
      streakCount: state.streakCount + 1,
      lastActiveDayKey: dayKey,
    };
  }

  return { ...state, streakCount: 1, lastActiveDayKey: dayKey };
}

function normalizeState(state: RewardState, now: Date): RewardState {
  const dayKey = getDayKey(now);
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);
  let next = { ...state };

  if (next.dayKey !== dayKey) {
    next.dayKey = dayKey;
    next.completedToday = 0;
    next.surprisesToday = 0;
  }

  if (next.weekKey !== weekKey) {
    next.weekKey = weekKey;
    next.completedThisWeek = 0;
  }

  if (next.graceMonthKey !== monthKey) {
    next.graceMonthKey = monthKey;
    next.graceDaysRemaining = 2;
  }

  return next;
}

function updateCompletionCounters(state: RewardState, completed: boolean): RewardState {
  if (!completed) return state;
  return {
    ...state,
    completedToday: state.completedToday + 1,
    completedThisWeek: state.completedThisWeek + 1,
  };
}

function buildRewardCardId(seed: number): string {
  return `card-${seed}-${Date.now()}`;
}

export class RewardEngine {
  static async onVerseCompleted(payload: RewardPayload, t: (key: string) => string): Promise<RewardResult> {
    const data = await loadRewardsData();
    const now = new Date(payload.timestamp);
    const dayKey = getDayKey(now);

    let state = normalizeState(data.state, now);
    let vitrail: VitrailState = { ...data.vitrail, tiles: { ...data.vitrail.tiles } };
    let cards: RewardCardsState = { ...data.cards, list: [...data.cards.list] };

    let streakAdvanced = false;
    if (data.settings.streakEnabled && Boolean(payload.isCompleted)) {
      const previousActiveDayKey = state.lastActiveDayKey;
      state = updateStreak(state, dayKey);
      streakAdvanced = previousActiveDayKey !== dayKey;
    }

    state = updateCompletionCounters(state, Boolean(payload.isCompleted));

    const masteryBefore = payload.masteryBefore ?? 0;
    const masteryAfter = payload.masteryAfter ?? masteryBefore;
    const masteryStageBefore = getMasteryStage(masteryBefore);
    const masteryStageAfter = getMasteryStage(masteryAfter);
    const masteryStageChanged = masteryStageBefore !== masteryStageAfter;

    if (payload.verseId) {
      vitrail.tiles[payload.verseId] = {
        masteryLevel: masteryAfter,
        lastCompletedAt: payload.timestamp,
        special: vitrail.tiles[payload.verseId]?.special,
      };
    }

    const seedBase = hashString(`${payload.verseId}-${dayKey}`);
    const detailLines = buildDetailLines(payload, data.settings.streakEnabled ? state.streakCount : null, t);

    let result: RewardResult = {};

    if (data.settings.streakEnabled && streakAdvanced && (state.streakCount >= 1 && state.streakCount <= 3)) {
      result.streakCelebrationTier = state.streakCount as 1 | 2 | 3;
    }

    if (data.settings.enableRewards) {
      const microMessageKey = masteryStageChanged
        ? pickFromList(rewardCopy.masteryMessages, seedBase)
        : pickFromList(rewardCopy.microMessages, seedBase);

      result.micro = {
        toastType: masteryStageChanged ? 'mastery' : 'completion',
        messageKey: microMessageKey,
        detailLines,
        haptic: data.settings.enableHaptics,
        sound: data.settings.enableSound,
        animation: masteryStageChanged ? 'scale' : 'rocket',
      };
    }

    const milestones: RewardMilestoneResult[] = [];

    if (masteryStageChanged && data.settings.enableRewards) {
      milestones.push({
        type: 'masteryUp',
        showFullScreen: false,
        messageKey: pickFromList(rewardCopy.masteryMilestones, seedBase + 3),
        toastMessageKey: pickFromList(rewardCopy.masteryMilestones, seedBase + 5),
        haptic: data.settings.enableHaptics,
        sound: data.settings.enableSound,
      });
    }

    if (payload.isCompleted && data.settings.enableRewards) {
      if (state.completedToday === data.settings.dailyGoal) {
        milestones.push({
          type: 'dailyGoal',
          showFullScreen: false,
          messageKey: pickFromList(rewardCopy.dailyMilestones, seedBase + 7),
          toastMessageKey: pickFromList(rewardCopy.dailyMilestones, seedBase + 11),
          haptic: data.settings.enableHaptics,
          sound: data.settings.enableSound,
        });
      }
      if (state.completedThisWeek === data.settings.weeklyGoal) {
        milestones.push({
          type: 'weeklyGoal',
          showFullScreen: false,
          messageKey: pickFromList(rewardCopy.weeklyMilestones, seedBase + 13),
          toastMessageKey: pickFromList(rewardCopy.weeklyMilestones, seedBase + 17),
          haptic: data.settings.enableHaptics,
          sound: data.settings.enableSound,
        });
      }
    }

    if (milestones.length > 0) {
      const prioritized = milestones.find((item) => item.type === 'weeklyGoal')
        || milestones.find((item) => item.type === 'dailyGoal')
        || milestones[0];

      const canShowFullScreen =
        !payload.shouldDeferFullScreen &&
        state.sessionFullScreenShownAt !== sessionId;

      result.milestone = {
        ...prioritized,
        showFullScreen: canShowFullScreen,
      };

      if (canShowFullScreen) {
        state.sessionFullScreenShownAt = sessionId;
      }
    }

    if (
      payload.isCompleted &&
      data.settings.enableRewards &&
      data.settings.enableSurprises &&
      state.surprisesToday < 2 &&
      now.getHours() < 22
    ) {
      const surpriseSeed = hashString(`${payload.verseId}-${dayKey}-${state.completedToday}`);
      if (shouldTriggerSurprise(surpriseSeed)) {
        const typeIndex = surpriseSeed % 3;
        const surpriseType = typeIndex === 0 ? 'card' : typeIndex === 1 ? 'gratitude' : 'specialTile';
        state.surprisesToday += 1;
        state.lastSurpriseAt = payload.timestamp;

        if (surpriseType === 'card' && payload.referenceText && payload.verseText) {
          const cardId = buildRewardCardId(surpriseSeed);
          const newCard = {
            id: cardId,
            verseId: payload.verseId,
            referenceText: payload.referenceText,
            verseText: payload.verseText,
            createdAt: payload.timestamp,
            styleVariant: surpriseSeed % 2 === 0 ? 'serene' : 'ink',
          } as const;
          cards.list.unshift(newCard);
          result.surprise = {
            type: 'card',
            showModal: true,
            messageKey: rewardCopy.surpriseMessages.card,
            cardId,
            card: newCard,
          };
        } else if (surpriseType === 'specialTile' && payload.verseId) {
          vitrail.tiles[payload.verseId] = {
            masteryLevel: masteryAfter,
            lastCompletedAt: payload.timestamp,
            special: true,
          };
          result.surprise = {
            type: 'specialTile',
            showModal: false,
            messageKey: rewardCopy.surpriseMessages.specialTile,
          };
        } else {
          result.surprise = {
            type: 'gratitude',
            showModal: true,
            messageKey: rewardCopy.surpriseMessages.gratitude,
            prayerKey: pickFromList(rewardCopy.prayers, surpriseSeed + 23),
          };
        }
      }
    }

    await saveRewardsData({ state, vitrail, cards });

    void enqueueBusinessEvent('reward_event', {
      event_type: result.surprise?.type ?? result.milestone?.type ?? result.micro?.toastType ?? 'reward_state_updated',
      verse_id: payload.verseId,
      occurred_at: payload.timestamp,
      payload: {
        rewardPayload: payload,
        rewardResult: result,
        rewardState: state,
      },
    });

    if (!data.settings.enableRewards) {
      return {};
    }

    return result;
  }
}
