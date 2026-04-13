import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RewardCardsState, RewardSettings, RewardState, VitrailState } from '../rewards/types';

const REWARDS_VERSION_KEY = '@rewards_version';
export const REWARDS_SETTINGS_KEY = '@rewards_settings';
export const REWARDS_STATE_KEY = '@rewards_state';
export const REWARDS_VITRAIL_KEY = '@rewards_vitrail';
export const REWARDS_CARDS_KEY = '@rewards_cards';

const CURRENT_VERSION = 1;

export const DEFAULT_REWARDS_SETTINGS: RewardSettings = {
  enableRewards: true,
  enableHaptics: true,
  enableSound: false,
  enableSurprises: true,
  dailyGoal: 3,
  weeklyGoal: 10,
  streakEnabled: true,
  supportReminderEnabled: true,
};

export const DEFAULT_REWARDS_STATE: RewardState = {
  dayKey: '',
  completedToday: 0,
  weekKey: '',
  completedThisWeek: 0,
  surprisesToday: 0,
  lastSurpriseAt: null,
  sessionFullScreenShownAt: null,
  streakCount: 0,
  lastActiveDayKey: null,
  graceDaysRemaining: 2,
  graceMonthKey: '',
};

export const DEFAULT_REWARDS_VITRAIL: VitrailState = {
  tiles: {},
};

export const DEFAULT_REWARDS_CARDS: RewardCardsState = {
  list: [],
};

export async function ensureRewardsStorage(): Promise<void> {
  const storedVersion = await AsyncStorage.getItem(REWARDS_VERSION_KEY);
  const version = storedVersion ? Number(storedVersion) : 0;

  if (version >= CURRENT_VERSION) {
    return;
  }

  const existing = await AsyncStorage.multiGet([
    REWARDS_SETTINGS_KEY,
    REWARDS_STATE_KEY,
    REWARDS_VITRAIL_KEY,
    REWARDS_CARDS_KEY,
  ]);

  const entries: [string, string][] = [];
  const existingMap = new Map(existing);

  if (!existingMap.get(REWARDS_SETTINGS_KEY)) {
    entries.push([REWARDS_SETTINGS_KEY, JSON.stringify(DEFAULT_REWARDS_SETTINGS)]);
  }
  if (!existingMap.get(REWARDS_STATE_KEY)) {
    entries.push([REWARDS_STATE_KEY, JSON.stringify(DEFAULT_REWARDS_STATE)]);
  }
  if (!existingMap.get(REWARDS_VITRAIL_KEY)) {
    entries.push([REWARDS_VITRAIL_KEY, JSON.stringify(DEFAULT_REWARDS_VITRAIL)]);
  }
  if (!existingMap.get(REWARDS_CARDS_KEY)) {
    entries.push([REWARDS_CARDS_KEY, JSON.stringify(DEFAULT_REWARDS_CARDS)]);
  }

  entries.push([REWARDS_VERSION_KEY, CURRENT_VERSION.toString()]);

  await AsyncStorage.multiSet(entries);
}
