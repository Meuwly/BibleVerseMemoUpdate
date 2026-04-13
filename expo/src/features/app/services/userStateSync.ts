import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { describeError } from '../../../../utils/errorLogging';
import { USER_STATE_SCOPE_KEYS, type UserStateScope } from './userStateScopes';
import { logUserStateSyncError, pushEventSyncOperation, pushScopeSyncOperation } from './userStateRemote';

const SYNC_QUEUE_KEY = '@user_state_sync_queue_v1';
const LOCAL_SCOPE_META_PREFIX = '@user_state_scope_meta_v1:';
const MAX_RETRY_DELAY_MS = 5 * 60_000;

interface ScopeSyncQueueItem {
  id: string;
  kind: 'scope';
  userId: string;
  scope: UserStateScope;
  updatedAt: string;
  storage: Record<string, string>;
  attempts: number;
  nextAttemptAt: number;
}

interface EventSyncQueueItem {
  id: string;
  kind: 'event';
  userId: string;
  eventType: 'verse_review' | 'quiz_attempt' | 'streak_event' | 'reward_event';
  payload: Record<string, unknown>;
  attempts: number;
  nextAttemptAt: number;
}

type SyncQueueItem = ScopeSyncQueueItem | EventSyncQueueItem;

type LocalScopeMeta = Partial<Record<UserStateScope, string>>;

let flushPromise: Promise<void> | null = null;

async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

function getMetaKey(userId: string): string {
  return `${LOCAL_SCOPE_META_PREFIX}${userId}`;
}

async function loadScopeMeta(userId: string): Promise<LocalScopeMeta> {
  const raw = await AsyncStorage.getItem(getMetaKey(userId));
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as LocalScopeMeta;
  } catch {
    return {};
  }
}

async function saveScopeMeta(userId: string, meta: LocalScopeMeta): Promise<void> {
  await AsyncStorage.setItem(getMetaKey(userId), JSON.stringify(meta));
}

async function loadQueue(): Promise<SyncQueueItem[]> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    return [];
  }
}

async function saveQueue(queue: SyncQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function computeRetryDelay(attempts: number): number {
  return Math.min(5_000 * (2 ** attempts), MAX_RETRY_DELAY_MS);
}

export async function recordLocalScopeMutation(userId: string, scope: UserStateScope, updatedAt: string): Promise<void> {
  const meta = await loadScopeMeta(userId);
  meta[scope] = updatedAt;
  await saveScopeMeta(userId, meta);
}

export async function getLocalScopeMutationMap(userId: string): Promise<LocalScopeMeta> {
  return loadScopeMeta(userId);
}

export async function enqueueScopeSync(scope: UserStateScope, storage: Record<string, string>, updatedAt: string, userIdOverride?: string): Promise<void> {
  const userId = userIdOverride ?? await getCurrentUserId();
  if (!userId) {
    return;
  }

  const queue = await loadQueue();
  const filteredQueue = queue.filter((item) => !(item.kind === 'scope' && item.userId === userId && item.scope === scope));
  filteredQueue.push({
    id: `${scope}:${userId}`,
    kind: 'scope',
    userId,
    scope,
    updatedAt,
    storage,
    attempts: 0,
    nextAttemptAt: Date.now(),
  });
  await saveQueue(filteredQueue);
}

export async function enqueueBusinessEvent(
  eventType: EventSyncQueueItem['eventType'],
  payload: Record<string, unknown>,
  userIdOverride?: string,
): Promise<void> {
  const userId = userIdOverride ?? await getCurrentUserId();
  if (!userId) {
    return;
  }

  const queue = await loadQueue();
  queue.push({
    id: `${eventType}:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    kind: 'event',
    userId,
    eventType,
    payload,
    attempts: 0,
    nextAttemptAt: Date.now(),
  });
  await saveQueue(queue);
}

export async function hydrateDedicatedStateFromStorage(userId: string, storage: Record<string, string>): Promise<void> {
  const now = new Date().toISOString();

  await Promise.all((Object.keys(USER_STATE_SCOPE_KEYS) as UserStateScope[]).map(async (scope) => {
    const relevantStorage = Object.fromEntries(
      Object.entries(storage).filter(([key]) => USER_STATE_SCOPE_KEYS[scope].includes(key)),
    );

    if (Object.keys(relevantStorage).length === 0) {
      return;
    }

    await recordLocalScopeMutation(userId, scope, now);
    await enqueueScopeSync(scope, storage, now, userId);
  }));
}

export async function flushUserStateSyncQueue(): Promise<void> {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    const now = Date.now();
    const queue = await loadQueue();
    if (queue.length === 0) {
      return;
    }

    const nextQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      if (item.nextAttemptAt > now) {
        nextQueue.push(item);
        continue;
      }

      try {
        if (item.kind === 'scope') {
          await pushScopeSyncOperation(item);
        } else {
          await pushEventSyncOperation(item);
        }
      } catch (error) {
        logUserStateSyncError(`Failed to sync ${item.kind === 'scope' ? item.scope : item.eventType}`, error);
        nextQueue.push({
          ...item,
          attempts: item.attempts + 1,
          nextAttemptAt: Date.now() + computeRetryDelay(item.attempts),
        } as SyncQueueItem);
      }
    }

    await saveQueue(nextQueue);
  })().catch((error) => {
    console.warn(`[UserStateSync] Unexpected flush error: ${describeError(error)}`);
  }).finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function isLocalScopeNewer(localUpdatedAt: string | undefined, remoteUpdatedAt: string | undefined): boolean {
  if (!localUpdatedAt) {
    return false;
  }
  if (!remoteUpdatedAt) {
    return true;
  }
  return new Date(localUpdatedAt).getTime() > new Date(remoteUpdatedAt).getTime();
}
