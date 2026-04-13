import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useAppProgress, useAppSettings } from "../contexts/AppContext";
import { AuthProvider, useAuthSessionState, useAuthSocialState, useAuthProfileState } from "../contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "../src/lib/supabase";
import { loadLastSeenXpChallengeResultKey, saveLastXpChallengeResult } from "../src/features/xpChallenge";
import { fetchLatestCompletedXpChallenge } from "../src/features/auth/services/xpChallengeResultService";
import { SupportModalProvider, useSupportModal } from "../contexts/SupportModalContext";
import { SupportModal } from "./modal";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describeError, installGlobalErrorLogging, isAbortLikeError } from "../utils/errorLogging";
import { t } from "../constants/translations";
import { quizCategories, type QuizCategory } from "../src/data/quizQuestions";
import { GlobalXpToast } from "../src/components/GlobalXpToast";
import { PollLaunchBanner } from "../src/features/polls/PollLaunchBanner";

const queryClient = new QueryClient();

const getQuizCategoryLabel = (uiLanguage: string, category: QuizCategory): string => {
  const item = quizCategories.find((entry) => entry.key === category);
  return item ? t(uiLanguage, item.labelKey) : category;
};

function ChallengeRequestPrompt() {
  const { uiLanguage } = useAppSettings();
  const {
    incomingChallengeRequests,
    incomingQuizChallengeRequests,
    acceptChallengeRequest,
    rejectChallengeRequest,
    fetchChallengeRequests,
    acceptQuizChallengeRequest,
    rejectQuizChallengeRequest,
    fetchQuizChallengeRequests,
  } = useAuthSocialState();
  const promptedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextRequest = incomingChallengeRequests.find((request) => !promptedIdsRef.current.has(`xp:${request.id}`));
    if (!nextRequest) {
      return;
    }

    promptedIdsRef.current.add(`xp:${nextRequest.id}`);
    const requestDate = new Date(nextRequest.created_at);
    const formattedDate = requestDate.toLocaleString(uiLanguage.startsWith('fr') ? 'fr-FR' : undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    Alert.alert(
      t(uiLanguage, 'xpChallengeIncomingTitle'),
      `${nextRequest.sender_username ?? t(uiLanguage, 'aFriend')} ${t(uiLanguage, 'xpChallengeIncomingInvite')}\n\n${t(uiLanguage, 'sentOnLabel')} ${formattedDate}.\n\n${t(uiLanguage, 'xpChallengeIncomingAcceptPrompt')}`,
      [
        {
          text: t(uiLanguage, 'decline'),
          style: 'destructive',
          onPress: () => {
            void rejectChallengeRequest(nextRequest.id);
          },
        },
        {
          text: t(uiLanguage, 'accept'),
          onPress: () => {
            void acceptChallengeRequest(nextRequest.id);
          },
        },
      ],
    );
  }, [acceptChallengeRequest, incomingChallengeRequests, rejectChallengeRequest, uiLanguage]);

  useEffect(() => {
    const nextRequest = incomingQuizChallengeRequests.find((request) => !promptedIdsRef.current.has(`quiz:${request.id}`));
    if (!nextRequest) {
      return;
    }

    promptedIdsRef.current.add(`quiz:${nextRequest.id}`);
    const requestDate = new Date(nextRequest.created_at);
    const formattedDate = requestDate.toLocaleString(uiLanguage.startsWith('fr') ? 'fr-FR' : undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    Alert.alert(
      t(uiLanguage, 'quizChallengeIncomingTitle'),
      `${nextRequest.sender_username ?? t(uiLanguage, 'aFriend')} ${t(uiLanguage, 'quizChallengeIncomingInvite')}\n\n${t(uiLanguage, 'quizCategoryLabel')}: ${getQuizCategoryLabel(uiLanguage, nextRequest.category)}\n\n${t(uiLanguage, 'sentOnLabel')} ${formattedDate}.\n\n${t(uiLanguage, 'quizChallengeIncomingAcceptPrompt')}`,
      [
        {
          text: t(uiLanguage, 'decline'),
          style: 'destructive',
          onPress: () => {
            void rejectQuizChallengeRequest(nextRequest.id);
          },
        },
        {
          text: t(uiLanguage, 'accept'),
          onPress: () => {
            void acceptQuizChallengeRequest(nextRequest.id);
          },
        },
      ],
    );
  }, [acceptQuizChallengeRequest, incomingQuizChallengeRequests, rejectQuizChallengeRequest, uiLanguage]);

  // Initial fetch is handled by useSocialState.refreshSocialData() on mount.
  // No duplicate fetch needed here.

  return null;
}


// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.error('[RootLayout] Failed to prevent splash auto hide:', error);
});

installGlobalErrorLogging();

function RootLayoutNav() {
  const { uiLanguage } = useAppSettings();
  const { shouldShowModal } = useSupportModal();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (shouldShowModal) {
      setModalVisible(true);
    }
  }, [shouldShowModal]);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <GlobalXpToast />
      <PollLaunchBanner />
      <Stack screenOptions={{ headerBackTitle: t(uiLanguage, 'back') }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="streak-success" options={{ headerShown: false }} />
        <Stack.Screen name="xp-success" options={{ headerShown: false }} />

      </Stack>
      <SupportModal visible={modalVisible} onClose={handleCloseModal} />
    </>
  );
}


function ChallengeResultWatcher() {
  const { session, user } = useAuthSessionState();
  const router = useRouter();
  const segments = useSegments();
  const lastHandledResultKeyRef = useRef<string>('');
  const canWatchChallengeResults = isSupabaseConfigured && Boolean(user?.id) && Boolean(session?.access_token);

  const checkLatestCompletedChallenge = useCallback(async () => {
    if (!canWatchChallengeResults || !user) {
      lastHandledResultKeyRef.current = '';
      return;
    }

    try {
      const latestResult = await fetchLatestCompletedXpChallenge(user.id);

      if (!latestResult) {
        return;
      }

      const latestKey = `${latestResult.id}:${latestResult.finishedAt}`;
      const lastSeenKey = await loadLastSeenXpChallengeResultKey();
      await saveLastXpChallengeResult(latestResult);

      if (lastSeenKey === latestKey || lastHandledResultKeyRef.current === latestKey) {
        return;
      }

      lastHandledResultKeyRef.current = latestKey;

      const isAlreadyOnResultScreen = segments.some((s) => s === 'xp-challenge-result');
      if (!isAlreadyOnResultScreen) {
        router.push('/xp-challenge-result' as any);
      }
    } catch (error) {
      if (isAbortLikeError(error)) {
        return;
      }

      const msg = describeError(error);
      const isNetworkError = msg.includes('Failed to fetch')
        || msg.includes('Network request failed')
        || msg.includes('network')
        || msg.includes('ECONNREFUSED');

      if (isNetworkError) {
        console.warn(`[ChallengeResultWatcher] Network error while checking challenge: ${msg}`);
      } else {
        console.error(`[ChallengeResultWatcher] Failed to check completed challenge: ${msg}`);
      }
    }
  }, [canWatchChallengeResults, router, segments, user]);

  useEffect(() => {
    void checkLatestCompletedChallenge();
  }, [checkLatestCompletedChallenge]);

  useEffect(() => {
    if (!canWatchChallengeResults || !user) {
      return undefined;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedCheck = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void checkLatestCompletedChallenge(), 800);
    };

    const channel = supabase
      .channel(`xp-challenge-results-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'xp_challenge_requests', filter: `sender_id=eq.${user.id}` }, debouncedCheck)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'xp_challenge_requests', filter: `receiver_id=eq.${user.id}` }, debouncedCheck)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [canWatchChallengeResults, checkLatestCompletedChallenge, user]);

  return null;
}

function AutoSyncProgress() {
  const { user } = useAuthSessionState();
  const { syncProgress } = useAuthProfileState();
  const { xpProgress, streakProgress, progress, quizProgress } = useAppProgress();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedPayloadRef = useRef<string>('');

  const payload = useMemo(() => ({
    totalXp: xpProgress.totalXp,
    currentStreak: streakProgress.currentStreak,
    bestStreak: streakProgress.bestStreak,
    versesCompleted: progress.filter((p) => p.completed).length,
    quizzesCompleted: quizProgress.quizzesCompleted,
  }), [xpProgress.totalXp, streakProgress.currentStreak, streakProgress.bestStreak, progress, quizProgress.quizzesCompleted]);

  const payloadKey = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (payloadKey === lastSyncedPayloadRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void syncProgress(payload).then(() => {
        lastSyncedPayloadRef.current = payloadKey;
      });
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [payload, payloadKey, syncProgress, user]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch((error) => {
      console.error('[RootLayout] Failed to hide splash screen:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <SupportModalProvider>
            <GestureHandlerRootView style={styles.root}>
              <AutoSyncProgress />
              <ChallengeRequestPrompt />
              <ChallengeResultWatcher />
              <RootLayoutNav />
            </GestureHandlerRootView>
          </SupportModalProvider>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
