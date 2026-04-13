import AsyncStorage from '@react-native-async-storage/async-storage';

import { describeError } from '../../../../utils/errorLogging';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { APP_STORAGE_TABLE, STORAGE_KEYS, safeJsonParse } from './appStorageShared';
import { loadRemoteUserStateSnapshot } from './userStateRemote';
import { flushUserStateSyncQueue, getLocalScopeMutationMap, isLocalScopeNewer, enqueueScopeSync, recordLocalScopeMutation } from './userStateSync';
import { getScopeForStorageKey, USER_STATE_SCOPE_KEYS, type UserStateScope } from './userStateScopes';

let storageCache: Record<string, string> | null = null;
let storageCacheUserId: string | null = null;
let remoteStorageFallbackUserId: string | null = null;
let remoteStorageFallbackUntil = 0;

const REMOTE_STORAGE_FALLBACK_MS = 30_000;

// ─── Incremental verse_progress sync ─────────────────────────────────────────
// On each cold load we record the fetch timestamp and the remote scope timestamp
// so that the next load can request only rows changed since then.
const VP_SYNC_TS_PREFIX = '@bvm/vp_sync_ts:';   // ISO timestamp of last fetch start
const VP_SCOPE_TS_PREFIX = '@bvm/vp_scope_ts:';  // remote scopeUpdatedAt from last load

type VpRow = { book: string; chapter: number | string; verse: number | string } & Record<string, unknown>;

async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

function shouldUseRemoteStorageFallback(userId: string): boolean {
  return remoteStorageFallbackUserId === userId && remoteStorageFallbackUntil > Date.now();
}

function clearRemoteStorageFallback(userId?: string | null): void {
  if (typeof userId === 'string' && remoteStorageFallbackUserId && remoteStorageFallbackUserId !== userId) {
    return;
  }

  remoteStorageFallbackUserId = null;
  remoteStorageFallbackUntil = 0;
}

function markRemoteStorageUnavailable(userId: string, error: unknown): void {
  remoteStorageFallbackUserId = userId;
  remoteStorageFallbackUntil = Date.now() + REMOTE_STORAGE_FALLBACK_MS;
  console.warn(
    `[AppStorage] Falling back to AsyncStorage for ${REMOTE_STORAGE_FALLBACK_MS / 1000}s: ${describeError(error)}`,
  );
}

async function mirrorValueToLocalCache(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

async function loadLocalScopeOverrides(
  userId: string,
  baseStorage: Record<string, string>,
  remoteScopeUpdatedAt: Partial<Record<UserStateScope, string>>,
): Promise<Record<string, string>> {
  const mergedStorage = { ...baseStorage };
  const localScopeMeta = await getLocalScopeMutationMap(userId);

  for (const scope of Object.keys(USER_STATE_SCOPE_KEYS) as UserStateScope[]) {
    if (!isLocalScopeNewer(localScopeMeta[scope], remoteScopeUpdatedAt[scope])) {
      continue;
    }

    const localEntries = await AsyncStorage.multiGet(USER_STATE_SCOPE_KEYS[scope]);
    for (const [key, value] of localEntries) {
      if (value === null) {
        delete mergedStorage[key];
      } else {
        mergedStorage[key] = value;
      }
    }

    await enqueueScopeSync(scope, mergedStorage, localScopeMeta[scope] ?? new Date().toISOString(), userId);
  }

  return mergedStorage;
}

async function ensureRemoteStorageLoaded(userId: string): Promise<{ userId: string; storage: Record<string, string> }> {
  if (shouldUseRemoteStorageFallback(userId)) {
    throw new Error('Remote user_app_state storage is temporarily disabled after a recent fetch failure.');
  }

  if (storageCache && storageCacheUserId === userId) {
    return { userId, storage: storageCache };
  }

  // Read incremental sync state in parallel to minimise latency
  const vpSyncTsKey = VP_SYNC_TS_PREFIX + userId;
  const vpScopeTsKey = VP_SCOPE_TS_PREFIX + userId;
  const [lastVpSyncTs, lastVpScopeTs, existingVpJson] = await Promise.all([
    AsyncStorage.getItem(vpSyncTsKey),
    AsyncStorage.getItem(vpScopeTsKey),
    AsyncStorage.getItem(STORAGE_KEYS.progress),
  ]);

  // Record the fetch start time BEFORE the network call so we never miss a row
  // that lands on the server while the request is in flight.
  const fetchStartTs = new Date().toISOString();
  const isIncremental = Boolean(lastVpSyncTs);

  const remoteSnapshot = await loadRemoteUserStateSnapshot(userId, {
    verseProgressSyncAfter: isIncremental ? lastVpSyncTs! : undefined,
  });

  // Merge incremental verse_progress rows with the local baseline
  if (isIncremental) {
    const newRowsJson = remoteSnapshot.storage[STORAGE_KEYS.progress];
    const newRows = newRowsJson ? safeJsonParse<VpRow[]>(newRowsJson, []) : null;
    const hasNewRows = Boolean(newRows && newRows.length > 0);

    if (existingVpJson) {
      if (hasNewRows) {
        // Overlay changed/new rows onto the existing full set
        const existingRows = safeJsonParse<VpRow[]>(existingVpJson, []);
        const rowMap = new Map(existingRows.map(r => [`${r.book}:${r.chapter}:${r.verse}`, r]));
        for (const row of newRows!) {
          rowMap.set(`${row.book}:${row.chapter}:${row.verse}`, row);
        }
        remoteSnapshot.storage[STORAGE_KEYS.progress] = JSON.stringify(Array.from(rowMap.values()));
      } else {
        // Nothing changed remotely – restore the full local baseline
        remoteSnapshot.storage[STORAGE_KEYS.progress] = existingVpJson;
      }
    }

    // Preserve the remote scope timestamp when no new rows were returned so
    // that loadLocalScopeOverrides does not incorrectly treat local data as newer.
    if (lastVpScopeTs && !remoteSnapshot.scopeUpdatedAt.verse_progress) {
      remoteSnapshot.scopeUpdatedAt.verse_progress = lastVpScopeTs;
    }
  }

  // Let any pending local offline mutations win over the (possibly partial) remote data
  const mergedStorage = await loadLocalScopeOverrides(userId, remoteSnapshot.storage, remoteSnapshot.scopeUpdatedAt);

  storageCache = mergedStorage;
  storageCacheUserId = userId;
  clearRemoteStorageFallback(userId);

  // Persist incremental sync markers and the final verse_progress baseline so
  // the next cold load can use them.
  const newVpScopeTs = remoteSnapshot.scopeUpdatedAt.verse_progress;
  await Promise.all([
    AsyncStorage.setItem(vpSyncTsKey, fetchStartTs),
    newVpScopeTs ? AsyncStorage.setItem(vpScopeTsKey, newVpScopeTs) : Promise.resolve(),
    mergedStorage[STORAGE_KEYS.progress]
      ? AsyncStorage.setItem(STORAGE_KEYS.progress, mergedStorage[STORAGE_KEYS.progress])
      : Promise.resolve(),
  ]);

  await supabase.from(APP_STORAGE_TABLE).upsert({
    user_id: userId,
    storage: mergedStorage,
    updated_at: new Date().toISOString(),
  });

  void flushUserStateSyncQueue();

  return { userId, storage: mergedStorage };
}

async function persistLegacyRemoteStorage(userId: string, storage: Record<string, string>): Promise<void> {
  await supabase.from(APP_STORAGE_TABLE).upsert({
    user_id: userId,
    storage,
    updated_at: new Date().toISOString(),
  });
}

export async function storageGetItem(key: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return AsyncStorage.getItem(key);
  }

  try {
    const loaded = await ensureRemoteStorageLoaded(userId);
    const value = loaded.storage[key] ?? null;
    await mirrorValueToLocalCache(key, value);
    return value;
  } catch (error) {
    if (!shouldUseRemoteStorageFallback(userId)) {
      markRemoteStorageUnavailable(userId, error);
    }
    return AsyncStorage.getItem(key);
  }
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);

  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const scope = getScopeForStorageKey(key);
  const updatedAt = new Date().toISOString();

  try {
    const loaded = await ensureRemoteStorageLoaded(userId);
    loaded.storage[key] = value;
    storageCache = loaded.storage;

    await persistLegacyRemoteStorage(userId, loaded.storage);

    if (scope) {
      await recordLocalScopeMutation(userId, scope, updatedAt);
      await enqueueScopeSync(scope, loaded.storage, updatedAt, userId);
      void flushUserStateSyncQueue();
    }
  } catch (error) {
    if (!shouldUseRemoteStorageFallback(userId)) {
      markRemoteStorageUnavailable(userId, error);
    }

    if (scope) {
      await recordLocalScopeMutation(userId, scope, updatedAt);
      await enqueueScopeSync(scope, { ...(storageCache ?? {}), [key]: value }, updatedAt, userId);
    }
  }
}

export async function storageRemoveItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);

  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const scope = getScopeForStorageKey(key);
  const updatedAt = new Date().toISOString();

  try {
    const loaded = await ensureRemoteStorageLoaded(userId);
    delete loaded.storage[key];
    storageCache = loaded.storage;

    await persistLegacyRemoteStorage(userId, loaded.storage);

    if (scope) {
      await recordLocalScopeMutation(userId, scope, updatedAt);
      await enqueueScopeSync(scope, loaded.storage, updatedAt, userId);
      void flushUserStateSyncQueue();
    }
  } catch (error) {
    if (!shouldUseRemoteStorageFallback(userId)) {
      markRemoteStorageUnavailable(userId, error);
    }

    if (scope) {
      const nextStorage = { ...(storageCache ?? {}) };
      delete nextStorage[key];
      await recordLocalScopeMutation(userId, scope, updatedAt);
      await enqueueScopeSync(scope, nextStorage, updatedAt, userId);
    }
  }
}

export function resetAppStorageCache(userId?: string | null): void {
  const previousUserId = storageCacheUserId;
  storageCache = null;
  storageCacheUserId = userId ?? null;
  clearRemoteStorageFallback();

  // When logging out or switching accounts, remove the incremental sync markers
  // so the next login always starts with a clean full fetch.
  if (previousUserId && previousUserId !== storageCacheUserId) {
    void AsyncStorage.multiRemove([
      VP_SYNC_TS_PREFIX + previousUserId,
      VP_SCOPE_TS_PREFIX + previousUserId,
    ]);
  }
}

export { APP_STORAGE_TABLE, STORAGE_KEYS, safeJsonParse };
