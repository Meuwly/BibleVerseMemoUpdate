import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { describeError } from '../../../../utils/errorLogging';
import { normalizeUsernameInput, validateUsername } from '../../../lib/authValidation';
import { createProfileForUser } from '../services/profileService';

const NETWORK_FAILURE_PATTERN = /network request failed|failed to fetch/i;
export const SUPABASE_CONFIG_MISSING_ERROR = 'supabaseConfigMissing';

function getErrorText(error: unknown): string {
  return describeError(error) || 'authErrorGeneric';
}

function toFriendlyAuthError(error: unknown): string {
  const message = getErrorText(error);
  const normalizedMessage = message.toLowerCase();

  if (NETWORK_FAILURE_PATTERN.test(message)) {
    return 'authErrorNetwork';
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'authErrorRateLimit';
  }

  return message;
}

interface UseAuthSessionParams {
  onSignedInUser: (userId: string) => Promise<void>;
}

export function useAuthSession({ onSignedInUser }: UseAuthSessionParams) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);

  const fetchInitialSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await onSignedInUser(currentSession.user.id);
      }
    } catch (error) {
      console.error('[AuthSession] Failed to get session:', error);
    } finally {
      setIsAuthReady(true);
    }
  }, [onSignedInUser]);

  useEffect(() => {
    void fetchInitialSession();
  }, [fetchInitialSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession?.user) {
        return;
      }

      if (pendingUsername) {
        await createProfileForUser(newSession.user.id, pendingUsername);
        setPendingUsername(null);
      }

      await onSignedInUser(newSession.user.id);
    });

    return () => subscription.unsubscribe();
  }, [onSignedInUser, pendingUsername]);

  const signUp = useCallback(async (email: string, password: string, username: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      console.warn('[AuthSession] Sign up blocked: Supabase environment variables are missing.');
      return { error: SUPABASE_CONFIG_MISSING_ERROR };
    }

    setIsLoading(true);
    try {
      const normalizedUsername = normalizeUsernameInput(username);
      const usernameError = validateUsername(normalizedUsername);
      if (usernameError) {
        return { error: usernameError };
      }

      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (checkError) {
        return { error: toFriendlyAuthError(checkError) };
      }
      if (existingUser) {
        return { error: 'Username already taken' };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: toFriendlyAuthError(error) };
      }

      if (data.user) {
        if (data.session) {
          await createProfileForUser(data.user.id, normalizedUsername);
          await onSignedInUser(data.user.id);
        } else {
          setPendingUsername(normalizedUsername);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: toFriendlyAuthError(error) };
    } finally {
      setIsLoading(false);
    }
  }, [onSignedInUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      console.warn('[AuthSession] Sign in blocked: Supabase environment variables are missing.');
      return { error: SUPABASE_CONFIG_MISSING_ERROR };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? toFriendlyAuthError(error) : null };
    } catch (error) {
      return { error: toFriendlyAuthError(error) };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthSession] Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthReady,
    signUp,
    signIn,
    signOut,
  };
}
