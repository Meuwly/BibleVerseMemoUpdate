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

  const remoteSnapshot = await loadRemoteUserStateSnapshot(userId);
  const mergedStorage = await loadLocalScopeOverrides(userId, remoteSnapshot.storage, remoteSnapshot.scopeUpdatedAt);

  storageCache = mergedStorage;
  storageCacheUserId = userId;
  clearRemoteStorageFallback(userId);

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
  storageCache = null;
  storageCacheUserId = userId ?? null;
  clearRemoteStorageFallback();
}

export { APP_STORAGE_TABLE, STORAGE_KEYS, safeJsonParse };
