import createContextHook from '@nkzw/create-context-hook';

import { useAuthSession } from '../../src/features/auth/hooks/useAuthSession';

export const [AuthSessionProvider, useAuthSessionState] = createContextHook(() => {
  return useAuthSession({
    onSignedInUser: async () => {},
  });
});
