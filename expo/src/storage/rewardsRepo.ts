import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { RewardCardsState, RewardSettings, RewardState, VitrailState } from '../rewards/types';
import { describeError } from '../../utils/errorLogging';
import {
  DEFAULT_REWARDS_CARDS,
  DEFAULT_REWARDS_SETTINGS,
  DEFAULT_REWARDS_STATE,
  DEFAULT_REWARDS_VITRAIL,
  REWARDS_CARDS_KEY,
  REWARDS_SETTINGS_KEY,
  REWARDS_STATE_KEY,
  REWARDS_VITRAIL_KEY,
  ensureRewardsStorage,
} from './migrations';
import { loadRemoteRewardStateSnapshot } from '../features/app/services/userStateRemote';
import { enqueueScopeSync, flushUserStateSyncQueue, getLocalScopeMutationMap, isLocalScopeNewer, recordLocalScopeMutation } from '../features/app/services/userStateSync';

interface RewardsDataBundle {
  settings: RewardSettings;
  state: RewardState;
  vitrail: VitrailState;
  cards: RewardCardsState;
}

function isNetworkFetchFailure(error: unknown): boolean {
  const message = describeError(error).toLowerCase();

  return message.includes('failed to fetch')
    || message.includes('network request failed')
    || message.includes('load failed')
    || message.includes('network');
}

function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function loadLocalRewardsData(): Promise<RewardsDataBundle> {
  const [settingsRaw, stateRaw, vitrailRaw, cardsRaw] = await AsyncStorage.multiGet([
    REWARDS_SETTINGS_KEY,
    REWARDS_STATE_KEY,
    REWARDS_VITRAIL_KEY,
    REWARDS_CARDS_KEY,
  ]);

  return {
    settings: { ...DEFAULT_REWARDS_SETTINGS, ...parseJSON(settingsRaw[1], DEFAULT_REWARDS_SETTINGS) },
    state: parseJSON(stateRaw[1], DEFAULT_REWARDS_STATE),
    vitrail: parseJSON(vitrailRaw[1], DEFAULT_REWARDS_VITRAIL),
    cards: parseJSON(cardsRaw[1], DEFAULT_REWARDS_CARDS),
  };
}

function toStorageBundle(bundle: RewardsDataBundle): Record<string, string> {
  return {
    [REWARDS_SETTINGS_KEY]: JSON.stringify(bundle.settings),
    [REWARDS_STATE_KEY]: JSON.stringify(bundle.state),
    [REWARDS_VITRAIL_KEY]: JSON.stringify(bundle.vitrail),
    [REWARDS_CARDS_KEY]: JSON.stringify(bundle.cards),
  };
}

async function mirrorBundleToLocal(bundle: RewardsDataBundle): Promise<void> {
  await AsyncStorage.multiSet(Object.entries(toStorageBundle(bundle)));
}

export async function loadRewardsData(): Promise<RewardsDataBundle> {
  await ensureRewardsStorage();
  const localBundle = await loadLocalRewardsData();
  const userId = await getCurrentUserId();

  if (!userId) {
    return localBundle;
  }

  let snapshot: Awaited<ReturnType<typeof loadRemoteRewardStateSnapshot>>['snapshot'] = null;
  let updatedAt: string | null = null;

  try {
    const remoteState = await loadRemoteRewardStateSnapshot(userId);
    snapshot = remoteState.snapshot;
    updatedAt = remoteState.updatedAt;
  } catch (error) {
    if (isNetworkFetchFailure(error)) {
      console.warn('[Rewards] Falling back to local rewards data after remote fetch failure:', describeError(error));
      return localBundle;
    }

    throw error;
  }

  if (!snapshot) {
    return localBundle;
  }

  const localMeta = await getLocalScopeMutationMap(userId);
  if (isLocalScopeNewer(localMeta.reward_state, updatedAt ?? undefined)) {
    await enqueueScopeSync('reward_state', toStorageBundle(localBundle), localMeta.reward_state ?? new Date().toISOString(), userId);
    void flushUserStateSyncQueue();
    return localBundle;
  }

  const remoteBundle: RewardsDataBundle = {
    settings: snapshot.settings,
    state: snapshot.state,
    vitrail: snapshot.vitrail,
    cards: snapshot.cards,
  };
  await mirrorBundleToLocal(remoteBundle);
  return remoteBundle;
}

export async function saveRewardsData(update: Partial<RewardsDataBundle>): Promise<void> {
  const current = await loadLocalRewardsData();
  const next: RewardsDataBundle = {
    settings: update.settings ?? current.settings,
    state: update.state ?? current.state,
    vitrail: update.vitrail ?? current.vitrail,
    cards: update.cards ?? current.cards,
  };

  await mirrorBundleToLocal(next);

  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const updatedAt = new Date().toISOString();
  await recordLocalScopeMutation(userId, 'reward_state', updatedAt);
  await enqueueScopeSync('reward_state', toStorageBundle(next), updatedAt, userId);
  void flushUserStateSyncQueue();
}

export async function updateRewardsSettings(update: Partial<RewardSettings>): Promise<RewardSettings> {
  const { settings } = await loadRewardsData();
  const next = { ...settings, ...update };
  await saveRewardsData({ settings: next });
  return next;
}

export async function getRewardsSettings(): Promise<RewardSettings> {
  const { settings } = await loadRewardsData();
  return settings;
}

export async function getRewardsVitrail(): Promise<VitrailState> {
  const { vitrail } = await loadRewardsData();
  return vitrail;
}

export async function getRewardsCards(): Promise<RewardCardsState> {
  const { cards } = await loadRewardsData();
  return cards;
}
