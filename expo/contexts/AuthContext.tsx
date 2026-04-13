import React, { useMemo, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { AuthProfileProvider, useAuthProfileState } from './auth/AuthProfileContext';
import { AuthSessionProvider, useAuthSessionState } from './auth/AuthSessionContext';
import { AuthSocialProvider, useAuthSocialState } from './auth/AuthSocialContext';
import type {
  FriendRequest,
  IncomingChallengeRequest,
  IncomingQuizChallengeRequest,
  LeaderboardEntry,
  SyncProgressPayload,
  UserProfile,
} from '../src/features/auth/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthReady: boolean;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  friends: string[];
  incomingFriendRequests: FriendRequest[];
  incomingChallengeRequests: IncomingChallengeRequest[];
  incomingQuizChallengeRequests: IncomingQuizChallengeRequest[];
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  syncProgress: (data: SyncProgressPayload) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<{ error: string | null }>;
  sendChallengeRequest: (params: { receiverId: string; durationMinutes: number; senderUsername: string; receiverUsername: string }) => Promise<{ error: string | null }>;
  sendQuizChallengeRequest: (params: { receiverId: string; category: import('../src/data/quizQuestions').QuizCategory; questionCount: number }) => Promise<{ error: string | null }>;
  acceptFriendRequest: (requestId: string, senderId: string) => Promise<{ error: string | null }>;
  rejectFriendRequest: (requestId: string) => Promise<{ error: string | null }>;
  removeFriend: (friendId: string) => Promise<{ error: string | null }>;
  acceptChallengeRequest: (requestId: string) => Promise<{ error: string | null }>;
  rejectChallengeRequest: (requestId: string) => Promise<{ error: string | null }>;
  fetchChallengeRequests: () => Promise<void>;
  acceptQuizChallengeRequest: (requestId: string) => Promise<{ error: string | null }>;
  rejectQuizChallengeRequest: (requestId: string) => Promise<{ error: string | null }>;
  fetchQuizChallengeRequests: () => Promise<void>;
  updateUsername: (username: string) => Promise<{ error: string | null }>;
}

export function AuthProvider({ children }: PropsWithChildren) {
  return (
    <AuthSessionProvider>
      <AuthProfileProvider>
        <AuthSocialProvider>{children}</AuthSocialProvider>
      </AuthProfileProvider>
    </AuthSessionProvider>
  );
}

export function useAuth(): AuthState {
  const sessionState = useAuthSessionState();
  const profileState = useAuthProfileState();
  const socialState = useAuthSocialState();

  return useMemo(() => ({
    user: sessionState.user,
    session: sessionState.session,
    profile: profileState.profile,
    isLoading: sessionState.isLoading,
    isAuthReady: sessionState.isAuthReady,
    leaderboard: socialState.leaderboard,
    leaderboardLoading: socialState.leaderboardLoading,
    friends: socialState.friends,
    incomingFriendRequests: socialState.incomingFriendRequests,
    incomingChallengeRequests: socialState.incomingChallengeRequests,
    incomingQuizChallengeRequests: socialState.incomingQuizChallengeRequests,
    signUp: sessionState.signUp,
    signIn: sessionState.signIn,
    signOut: sessionState.signOut,
    syncProgress: profileState.syncProgress,
    fetchLeaderboard: socialState.fetchLeaderboard,
    sendFriendRequest: socialState.sendFriendRequest,
    sendChallengeRequest: socialState.sendChallengeRequest,
    sendQuizChallengeRequest: socialState.sendQuizChallengeRequest,
    acceptFriendRequest: socialState.acceptFriendRequest,
    rejectFriendRequest: socialState.rejectFriendRequest,
    removeFriend: socialState.removeFriend,
    acceptChallengeRequest: socialState.acceptChallengeRequest,
    rejectChallengeRequest: socialState.rejectChallengeRequest,
    fetchChallengeRequests: socialState.fetchChallengeRequests,
    acceptQuizChallengeRequest: socialState.acceptQuizChallengeRequest,
    rejectQuizChallengeRequest: socialState.rejectQuizChallengeRequest,
    fetchQuizChallengeRequests: socialState.fetchQuizChallengeRequests,
    updateUsername: profileState.updateUsername,
  }), [profileState, sessionState, socialState]);
}

export { useAuthProfileState, useAuthSessionState, useAuthSocialState };
