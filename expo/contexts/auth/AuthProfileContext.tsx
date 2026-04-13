import createContextHook from '@nkzw/create-context-hook';
import { useEffect } from 'react';

import { useProfileState } from '../../src/features/auth/hooks/useProfileState';
import { useAuthSessionState } from './AuthSessionContext';

export const [AuthProfileProvider, useAuthProfileState] = createContextHook(() => {
  const { user } = useAuthSessionState();
  const profileState = useProfileState(user?.id);
  const { clearProfile, fetchProfile } = profileState;

  useEffect(() => {
    if (!user?.id) {
      clearProfile();
      return;
    }

    void fetchProfile(user.id);
  }, [clearProfile, fetchProfile, user?.id]);

  return profileState;
});
