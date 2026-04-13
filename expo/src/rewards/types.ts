export type MasteryStage = 'DISCOVERY' | 'CORRECT' | 'STABLE' | 'SOLID' | 'MASTERED';

export interface RewardSettings {
  enableRewards: boolean;
  enableHaptics: boolean;
  enableSound: boolean;
  enableSurprises: boolean;
  dailyGoal: number;
  weeklyGoal: number;
  streakEnabled: boolean;
  supportReminderEnabled: boolean;
}

export interface RewardState {
  dayKey: string;
  completedToday: number;
  weekKey: string;
  completedThisWeek: number;
  surprisesToday: number;
  lastSurpriseAt: string | null;
  sessionFullScreenShownAt: string | null;
  streakCount: number;
  lastActiveDayKey: string | null;
  graceDaysRemaining: number;
  graceMonthKey: string;
}

export interface VitrailTileState {
  masteryLevel: number;
  lastCompletedAt: string;
  special?: boolean;
}

export interface VitrailState {
  tiles: Record<string, VitrailTileState>;
}

export interface RewardCard {
  id: string;
  verseId: string;
  referenceText: string;
  verseText: string;
  createdAt: string;
  styleVariant: 'classic' | 'serene' | 'ink' | 'light';
}

export interface RewardCardsState {
  list: RewardCard[];
}

export interface RewardPayload {
  verseId: string;
  language: string;
  version: string;
  mode: string;
  precision?: number;
  attempts?: number;
  masteryBefore?: number;
  masteryAfter?: number;
  timestamp: string;
  isCompleted?: boolean;
  referenceText?: string;
  verseText?: string;
  shouldDeferFullScreen?: boolean;
}

export interface RewardMicroResult {
  toastType: 'completion' | 'mastery' | 'streak' | 'milestone';
  messageKey: string;
  detailLines: string[];
  haptic: boolean;
  sound: boolean;
  animation: 'fade' | 'scale' | 'rocket';
}

export interface RewardMilestoneResult {
  type: 'dailyGoal' | 'weeklyGoal' | 'masteryUp';
  showFullScreen: boolean;
  messageKey: string;
  toastMessageKey: string;
  haptic: boolean;
  sound: boolean;
}

export interface RewardSurpriseResult {
  type: 'card' | 'gratitude' | 'specialTile';
  showModal: boolean;
  messageKey: string;
  cardId?: string;
  card?: RewardCard;
  prayerKey?: string;
}

export interface RewardResult {
  micro?: RewardMicroResult;
  milestone?: RewardMilestoneResult;
  surprise?: RewardSurpriseResult;
  streakCelebrationTier?: 1 | 2 | 3;
}
