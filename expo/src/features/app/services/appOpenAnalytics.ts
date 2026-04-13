import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../../../lib/supabase';

const DEVICE_ANALYTICS_ID_KEY = '@bvm/device_analytics_id';

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

export type AppOpenActor = {
  actorId: string;
  actorType: 'user' | 'device';
};

function generateLocalUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
}

export async function getOrCreateDeviceAnalyticsId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ANALYTICS_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = generateLocalUuid();
  await AsyncStorage.setItem(DEVICE_ANALYTICS_ID_KEY, created);
  return created;
}

export async function resolveAppOpenActor(userId?: string | null): Promise<AppOpenActor> {
  if (userId) {
    return {
      actorId: userId,
      actorType: 'user',
    };
  }

  return {
    actorId: await getOrCreateDeviceAnalyticsId(),
    actorType: 'device',
  };
}

export async function trackAppOpen(userId?: string | null): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const actor = await resolveAppOpenActor(userId);

  const { error } = await supabase.from('app_open_events').insert({
    actor_id: actor.actorId,
    actor_type: actor.actorType,
  });

  if (error) {
    console.warn('[AppOpenAnalytics] Failed to insert app_open_events row:', error.message);
  }
}

export async function getDailyAppOpenCountForActor(day: Date, userId?: string | null): Promise<number> {
  if (!isSupabaseConfigured) {
    return 0;
  }

  const actor = await resolveAppOpenActor(userId);
  const dayIso = DAY_FORMATTER.format(day);

  const { count, error } = await supabase
    .from('app_open_events')
    .select('*', { count: 'exact', head: true })
    .eq('opened_on', dayIso)
    .eq('actor_id', actor.actorId);

  if (error) {
    console.warn('[AppOpenAnalytics] Failed to fetch actor daily count:', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getDailyTotalAppOpenCount(day: Date): Promise<number> {
  if (!isSupabaseConfigured) {
    return 0;
  }

  const dayIso = DAY_FORMATTER.format(day);

  const { count, error } = await supabase
    .from('app_open_events')
    .select('*', { count: 'exact', head: true })
    .eq('opened_on', dayIso);

  if (error) {
    console.warn('[AppOpenAnalytics] Failed to fetch global daily count:', error.message);
    return 0;
  }

  return count ?? 0;
}
