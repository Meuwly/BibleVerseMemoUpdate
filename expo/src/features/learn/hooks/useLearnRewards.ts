import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  RewardCard,
  RewardMicroResult,
  RewardMilestoneResult,
  RewardSurpriseResult,
  RewardResult,
} from '../../../rewards/types';

const XP_BEFORE_ROCKET_DELAY_MS = 800;

export function useLearnRewards() {
  const [rewardToast, setRewardToast] = useState<RewardMicroResult | null>(null);
  const [rewardMilestone, setRewardMilestone] = useState<RewardMilestoneResult | null>(null);
  const [rewardSurprise, setRewardSurprise] = useState<RewardSurpriseResult | null>(null);
  const [rewardCard, setRewardCard] = useState<RewardCard | null>(null);
  const rewardToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRewardToastTimeout = useCallback(() => {
    if (!rewardToastTimeoutRef.current) {
      return;
    }

    clearTimeout(rewardToastTimeoutRef.current);
    rewardToastTimeoutRef.current = null;
  }, []);

  const resetRewards = useCallback(() => {
    clearRewardToastTimeout();
    setRewardToast(null);
    setRewardMilestone(null);
    setRewardSurprise(null);
    setRewardCard(null);
  }, [clearRewardToastTimeout]);

  const applyRewardResult = useCallback(
    (rewardResult: RewardResult) => {
      if (rewardResult.micro) {
        clearRewardToastTimeout();

        if (rewardResult.micro.animation === 'rocket') {
          rewardToastTimeoutRef.current = setTimeout(() => {
            setRewardToast(rewardResult.micro || null);
            rewardToastTimeoutRef.current = null;
          }, XP_BEFORE_ROCKET_DELAY_MS);
        } else {
          setRewardToast(rewardResult.micro);
        }
      }

      if (rewardResult.milestone) {
        if (rewardResult.milestone.showFullScreen) {
          setRewardMilestone(rewardResult.milestone);
        } else if (!rewardResult.micro) {
          setRewardToast({
            toastType: 'milestone',
            messageKey: rewardResult.milestone.toastMessageKey,
            detailLines: [],
            haptic: rewardResult.milestone.haptic,
            sound: rewardResult.milestone.sound,
            animation: 'fade',
          });
        }
      }

      if (rewardResult.surprise) {
        setRewardSurprise(rewardResult.surprise);
        if (rewardResult.surprise.card) {
          setRewardCard(rewardResult.surprise.card);
        }
      }
    },
    [clearRewardToastTimeout],
  );

  useEffect(() => () => {
    clearRewardToastTimeout();
  }, [clearRewardToastTimeout]);

  return {
    rewardToast,
    rewardMilestone,
    rewardSurprise,
    rewardCard,
    applyRewardResult,
    resetRewards,
    setRewardToast,
    setRewardMilestone,
    setRewardSurprise,
    setRewardCard,
  };
}
