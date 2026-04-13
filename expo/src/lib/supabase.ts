import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { describeError } from '../../utils/errorLogging';

const resolveEnv = (...candidates: (string | undefined)[]) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
};

const resolveExpoExtra = (...keys: string[]) => {
  const extra = Constants.expoConfig?.extra ?? Constants.manifest2?.extra;
  if (!extra) {
    return undefined;
  }

  for (const key of keys) {
    const value = extra[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

const extractHostname = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const withProtocol = trimmed.includes('://') ? trimmed : `http://${trimmed}`;

  try {
    return new URL(withProtocol).hostname;
  } catch {
    const hostnameCandidate = trimmed.split('/')[0]?.split(':')[0]?.trim();
    return hostnameCandidate || undefined;
  }
};

const resolveNativeDevHost = (): string | undefined => {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    typeof Constants.linkingUri === 'string' ? Constants.linkingUri : undefined,
  ];

  for (const candidate of hostCandidates) {
    const hostname = extractHostname(candidate);
    if (hostname && !isLoopbackHostname(hostname)) {
      return hostname;
    }
  }

  return undefined;
};

const devLog = (message: string, details?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(message, details ?? {});
  }
};

const rawSupabaseUrl = resolveEnv(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  resolveExpoExtra('EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
);

const rawSupabaseAnonKey = resolveEnv(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  resolveExpoExtra(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  ),
);

const isPlaceholderValue = (value: string | undefined) => Boolean(
  value
  && value !== 'undefined'
  && value.toLowerCase().includes('placeholder'),
);

const isLoopbackHostname = (hostname: string) => (
  hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname === '10.0.2.2'
);

const validateSupabaseUrl = (url: string | undefined): string | undefined => {
  if (!url || isPlaceholderValue(url)) {
    return undefined;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      console.warn('[Supabase] Invalid Supabase URL protocol. Use https:// for production.');
      return undefined;
    }

    if (parsed.protocol === 'http:' && (!__DEV__ || !isLoopbackHostname(parsed.hostname))) {
      console.warn('[Supabase] Refusing insecure Supabase URL. Use https:// except for trusted local development.');
      return undefined;
    }

    return parsed.toString();
  } catch (error) {
    console.warn('[Supabase] Invalid EXPO_PUBLIC_SUPABASE_URL format:', error);
    return undefined;
  }
};

const normalizeSupabaseUrlForAndroid = (url: string | undefined) => {
  if (!url || Platform.OS !== 'android') {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = '10.0.2.2';
      console.warn('[Supabase] Replaced localhost with 10.0.2.2 for Android emulator networking.');
      return parsed.toString();
    }
  } catch (error) {
    console.warn('[Supabase] Invalid EXPO_PUBLIC_SUPABASE_URL format:', error);
  }

  return url;
};

const normalizeSupabaseUrlForNativeDevHost = (url: string | undefined) => {
  if (!url || Platform.OS === 'web' || !__DEV__) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const originalHostname = parsed.hostname;
    if (!isLoopbackHostname(originalHostname)) {
      return url;
    }

    const nativeDevHost = resolveNativeDevHost();
    if (!nativeDevHost) {
      return url;
    }

    parsed.hostname = nativeDevHost;
    console.warn(`[Supabase] Replaced ${originalHostname} with ${nativeDevHost} for native device networking.`);
    return parsed.toString();
  } catch (error) {
    console.warn('[Supabase] Invalid EXPO_PUBLIC_SUPABASE_URL format:', error);
    return url;
  }
};

const warnAboutAndroidHttpUrl = (url: string | undefined) => {
  if (!url || Platform.OS !== 'android') {
    return;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:') {
      console.warn(
        '[Supabase] EXPO_PUBLIC_SUPABASE_URL uses http on Android. Prefer https in production and only use http for trusted local development.'
      );
    }
  } catch (error) {
    console.warn('[Supabase] Invalid EXPO_PUBLIC_SUPABASE_URL format:', error);
  }
};

const supabaseUrl = normalizeSupabaseUrlForAndroid(
  normalizeSupabaseUrlForNativeDevHost(validateSupabaseUrl(rawSupabaseUrl))
);
const supabaseAnonKey = isPlaceholderValue(rawSupabaseAnonKey) ? undefined : rawSupabaseAnonKey;

warnAboutAndroidHttpUrl(supabaseUrl);

const nativeSecureStorage = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const authStorage = Platform.OS === 'web' ? AsyncStorage : nativeSecureStorage;

const defaultFetch = globalThis.fetch?.bind(globalThis) as typeof fetch | undefined;

type RequestLike = Partial<RequestInit> & {
  url?: unknown;
  href?: unknown;
  uri?: unknown;
  request?: unknown;
  resource?: unknown;
  input?: unknown;
  clone?: unknown;
  method?: unknown;
  toString?: () => string;
};

const looksLikeRequestObject = (value: unknown): value is RequestLike => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as RequestLike;
  const constructorName = (record as { constructor?: { name?: unknown } }).constructor?.name;

  return constructorName === 'Request'
    || typeof record.clone === 'function'
    || typeof record.url !== 'undefined'
    || typeof record.href !== 'undefined';
};

const resolveUrlString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof URL !== 'undefined' && value instanceof URL) {
    return value.toString();
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as RequestLike;

  const directUrl = resolveUrlString(record.url);
  if (directUrl) {
    return directUrl;
  }

  const directHref = resolveUrlString(record.href);
  if (directHref) {
    return directHref;
  }

  const directUri = resolveUrlString(record.uri);
  if (directUri) {
    return directUri;
  }

  const nestedUrlCandidates = [record.request, record.resource, record.input];
  for (const candidate of nestedUrlCandidates) {
    const nestedUrl = resolveUrlString(candidate);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  if (typeof record.toString === 'function') {
    const serialized = record.toString();
    if (serialized && serialized !== '[object Object]') {
      return serialized;
    }
  }

  return undefined;
};

const isRequestLike = (input: unknown): input is RequestLike => (
  Boolean(input)
  && typeof input === 'object'
  && input !== null
  && typeof resolveUrlString(input) === 'string'
);

const buildFetchInitFromRequestLike = (input: RequestLike, init?: RequestInit): RequestInit | undefined => {
  const mergedInit: RequestInit = { ...(init ?? {}) };

  const requestLikeEntries: [keyof RequestInit, unknown][] = [
    ['body', input.body],
    ['cache', input.cache],
    ['credentials', input.credentials],
    ['headers', input.headers],
    ['integrity', input.integrity],
    ['keepalive', input.keepalive],
    ['method', input.method],
    ['mode', input.mode],
    ['redirect', input.redirect],
    ['referrer', input.referrer],
    ['referrerPolicy', input.referrerPolicy],
    ['signal', input.signal],
  ];

  for (const [key, value] of requestLikeEntries) {
    if (typeof mergedInit[key] === 'undefined' && typeof value !== 'undefined') {
      (mergedInit as RequestInit & Record<string, unknown>)[key as string] = value;
    }
  }

  return Object.keys(mergedInit).length > 0 ? mergedInit : undefined;
};

const normalizeFetchArgs = (
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
): { input: RequestInfo | URL; init?: RequestInit } => {
  const resolvedUrl = resolveUrlString(input);

  if (resolvedUrl && input && typeof input === 'object') {
    const requestLikeInput = input as RequestLike;

    return {
      input: resolvedUrl,
      init: looksLikeRequestObject(requestLikeInput) || isRequestLike(requestLikeInput)
        ? buildFetchInitFromRequestLike(requestLikeInput, init)
        : init,
    };
  }

  return { input: input as RequestInfo, init };
};

const resolveRequestUrl = (input: Parameters<typeof fetch>[0]): string => {
  const resolvedUrl = resolveUrlString(input);
  if (resolvedUrl) {
    return resolvedUrl;
  }

  return '[unknown-request-url]';
};

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;

const isTransientNetworkError = (errorMessage: string) => (
  errorMessage.includes('Failed to fetch')
  || errorMessage.includes('Network request failed')
  || errorMessage.includes('network')
  || errorMessage.includes('ECONNREFUSED')
  || errorMessage.includes('Load failed')
  || errorMessage.includes('ERR_CONNECTION')
);

const retryDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const supabaseFetch: typeof fetch = async (input, init) => {
  const requestUrl = resolveRequestUrl(input);
  const normalizedRequest = normalizeFetchArgs(input, init);
  const requestMethod = typeof Request !== 'undefined' && input instanceof Request
    ? (input as Request).method
    : undefined;
  const requestLikeMethod = isRequestLike(input) && typeof (input as RequestLike).method === 'string'
    ? (input as RequestLike).method
    : undefined;
  const method = normalizedRequest.init?.method
    ?? requestMethod
    ?? requestLikeMethod
    ?? 'GET';
  const fetchImplementation = defaultFetch ?? fetch;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const jitter = Math.random() * 200;
      await retryDelay(RETRY_BASE_DELAY_MS * attempt + jitter);
      devLog(`[Supabase] Retry attempt ${attempt}/${MAX_RETRIES}`, { method, requestUrl });
    } else {
      devLog('[Supabase] Fetch start', {
        platform: Platform.OS,
        method,
        requestUrl,
      });
    }

    try {
      const response = await fetchImplementation(normalizedRequest.input, normalizedRequest.init);

      devLog('[Supabase] Fetch complete', {
        platform: Platform.OS,
        method,
        requestUrl,
        status: response.status,
        ok: response.ok,
      });

      return response;
    } catch (error) {
      lastError = error;
      const errorMessage = describeError(error);

      if (attempt < MAX_RETRIES && isTransientNetworkError(errorMessage)) {
        console.warn(
          `[Supabase] Transient fetch error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${errorMessage} (url=${requestUrl})`,
        );
        continue;
      }

      const logLevel = isTransientNetworkError(errorMessage) ? 'warn' : 'error';
      console[logLevel](
        `[Supabase] Fetch failed: ${errorMessage} (platform=${Platform.OS}, method=${method}, url=${requestUrl})`,
      );
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  const errorMessage = describeError(lastError);
  const normalizedError = new Error(errorMessage);
  (normalizedError as Error & { cause?: unknown }).cause = lastError;
  throw normalizedError;
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl
  && supabaseAnonKey
  && !isPlaceholderValue(supabaseUrl)
  && !isPlaceholderValue(supabaseAnonKey),
);

devLog('[Supabase] Configuration status', {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isSupabaseConfigured,
  platform: Platform.OS,
});

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing Supabase env values. Define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
    global: {
      fetch: isSupabaseConfigured ? supabaseFetch : undefined,
      headers: {
        'X-Client-Info': 'BibleVerseMemo/mobile',
      },
    },
  }
);
