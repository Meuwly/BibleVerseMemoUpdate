import createContextHook from '@nkzw/create-context-hook';

import { useAuthSessionState } from './AuthSessionContext';
import { useSocialState } from '../../src/features/auth/hooks/useSocialState';
import { useAppSettings } from '../AppContext';

export const [AuthSocialProvider, useAuthSocialState] = createContextHook(() => {
  const { user, session } = useAuthSessionState();
  const { uiLanguage } = useAppSettings();
  return useSocialState(user?.id, session?.access_token, uiLanguage);
});
