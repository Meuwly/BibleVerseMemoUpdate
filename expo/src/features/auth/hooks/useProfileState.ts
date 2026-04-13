import { useCallback, useState } from 'react';

import { describeError } from '../../../../utils/errorLogging';
import type { SyncProgressPayload, UserProfile } from '../types';
import {
  ensureUsernameAvailable,
  fetchProfileByUserId,
  syncProfileProgress,
  updateProfileUsername,
} from '../services/profileService';

export function useProfileState(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async (nextUserId: string) => {
    try {
      const nextProfile = await fetchProfileByUserId(nextUserId);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      console.error('[AuthProfile] Error fetching profile:', error);
      return null;
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  const syncProgress = useCallback(async (data: SyncProgressPayload) => {
    if (!userId) {
      return;
    }

    try {
      const syncedProfile = await syncProfileProgress(data);
      if (syncedProfile) {
        setProfile(syncedProfile);
        return;
      }
    } catch (error) {
      console.error(`[AuthProfile] Sync exception: ${describeError(error)}`, error);
    }

    await fetchProfile(userId);
  }, [fetchProfile, userId]);

  const updateUsername = useCallback(async (username: string): Promise<{ error: string | null }> => {
    if (!userId) {
      return { error: 'Not logged in' };
    }

    try {
      const available = await ensureUsernameAvailable(username, userId);
      if (!available) {
        return { error: 'Username already taken' };
      }

      const updatedProfile = await updateProfileUsername(userId, username);
      setProfile(updatedProfile);
      return { error: null };
    } catch (error) {
      console.error('[AuthProfile] Update username error:', error);
      return { error: describeError(error) || 'An unexpected error occurred' };
    }
  }, [userId]);

  return {
    profile,
    setProfile,
    fetchProfile,
    clearProfile,
    syncProgress,
    updateUsername,
  };
}
