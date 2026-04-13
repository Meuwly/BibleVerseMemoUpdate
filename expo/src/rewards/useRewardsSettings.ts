import { useCallback, useEffect, useState } from 'react';
import type { RewardSettings } from './types';
import { DEFAULT_REWARDS_SETTINGS } from '../storage/migrations';
import { getRewardsSettings, updateRewardsSettings } from '../storage/rewardsRepo';

export function useRewardsSettings() {
  const [settings, setSettings] = useState<RewardSettings>(DEFAULT_REWARDS_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getRewardsSettings()
      .then((data) => {
        if (isMounted) {
          setSettings(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = useCallback(async (update: Partial<RewardSettings>) => {
    const next = await updateRewardsSettings(update);
    setSettings(next);
  }, []);

  return { settings, updateSettings, isLoading };
}
