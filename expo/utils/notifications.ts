import { Platform } from 'react-native';
import { describeError } from './errorLogging';

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  streakWarningEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: false,
  dailyReminderHour: 9,
  dailyReminderMinute: 0,
  streakWarningEnabled: false,
};

const DAILY_REMINDER_ID = 'daily-practice-reminder';
const STREAK_WARNING_ID = 'streak-expiration-warning';


type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let isNotificationHandlerConfigured = false;

function getNotificationsModule(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  notificationsModule ??= require('expo-notifications') as NotificationsModule;

  if (!isNotificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    isNotificationHandlerConfigured = true;
  }

  return notificationsModule;
}


export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform, skipping permissions');
    return false;
  }

  try {
    const Notifications = getNotificationsModule();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    console.log('[Notifications] Permission granted');
    return true;
  } catch (error) {
    console.error(`[Notifications] Error requesting permissions: ${describeError(error)}`, error);
    return false;
  }
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = getNotificationsModule();
    await cancelDailyReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      identifier: DAILY_REMINDER_ID,
    });

    console.log(`[Notifications] Daily reminder scheduled at ${hour}:${String(minute).padStart(2, '0')}`);
  } catch (error) {
    console.error(`[Notifications] Error scheduling daily reminder: ${describeError(error)}`, error);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = getNotificationsModule();
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    console.log('[Notifications] Daily reminder cancelled');
  } catch (error) {
    console.error(`[Notifications] Error cancelling daily reminder: ${describeError(error)}`, error);
  }
}

export async function scheduleStreakWarning(
  lastActivityDate: string | null,
  title: string,
  body: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = getNotificationsModule();
    await cancelStreakWarning();

    if (!lastActivityDate) {
      console.log('[Notifications] No last activity date, skipping streak warning');
      return;
    }

    const lastActivity = new Date(`${lastActivityDate}T00:00:00`);
    const nextDay = new Date(lastActivity);
    nextDay.setDate(nextDay.getDate() + 1);

    const expirationTime = new Date(nextDay);
    expirationTime.setHours(23, 59, 59, 999);

    const warningTime = new Date(expirationTime.getTime() - 3 * 60 * 60 * 1000);

    const now = new Date();
    if (warningTime.getTime() <= now.getTime()) {
      console.log('[Notifications] Streak warning time already passed');
      return;
    }

    const secondsUntilWarning = Math.max(
      Math.floor((warningTime.getTime() - now.getTime()) / 1000),
      1,
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilWarning,
        repeats: false,
      },
      identifier: STREAK_WARNING_ID,
    });

    console.log(`[Notifications] Streak warning scheduled in ${secondsUntilWarning}s (at ${warningTime.toISOString()})`);
  } catch (error) {
    console.error(`[Notifications] Error scheduling streak warning: ${describeError(error)}`, error);
  }
}

export async function cancelStreakWarning(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = getNotificationsModule();
    await Notifications.cancelScheduledNotificationAsync(STREAK_WARNING_ID);
    console.log('[Notifications] Streak warning cancelled');
  } catch (error) {
    console.error(`[Notifications] Error cancelling streak warning: ${describeError(error)}`, error);
  }
}

export async function sendInstantNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const Notifications = getNotificationsModule();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Notifications] Skipping instant notification because permission is not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: null,
    });

    console.log('[Notifications] Instant notification sent');
  } catch (error) {
    console.error(`[Notifications] Error sending instant notification: ${describeError(error)}`, error);
  }
}
