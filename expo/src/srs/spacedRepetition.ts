import type { VerseProgress, VerseReviewRating, VerseSrsState } from '../../types/database';

const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;

const DEFAULT_SRS_STATE: VerseSrsState = {
  reviewCount: 0,
  lapseCount: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
  difficulty: 0.35,
  stability: 0,
  retrievability: 0,
  lastReviewAt: null,
  lastRating: null,
  nextReviewAt: null,
};

export type ReviewSignal = {
  correct: boolean;
  precision?: number;
  hintsUsed?: number;
  revealedRatio?: number;
  inputLikelyPasted?: boolean;
};

export type SrsSnapshot = {
  dueNow: boolean;
  dueInDays: number;
  nextReviewLabel: string;
  intervalDays: number;
  urgency: 'learning' | 'due' | 'soon' | 'scheduled';
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDefaultSrsState(): VerseSrsState {
  return { ...DEFAULT_SRS_STATE };
}

export function normalizeSrsState(state?: Partial<VerseSrsState> | null): VerseSrsState {
  return {
    reviewCount: Math.max(0, Math.round(state?.reviewCount ?? DEFAULT_SRS_STATE.reviewCount)),
    lapseCount: Math.max(0, Math.round(state?.lapseCount ?? DEFAULT_SRS_STATE.lapseCount)),
    consecutiveCorrect: Math.max(0, Math.round(state?.consecutiveCorrect ?? DEFAULT_SRS_STATE.consecutiveCorrect)),
    consecutiveIncorrect: Math.max(0, Math.round(state?.consecutiveIncorrect ?? DEFAULT_SRS_STATE.consecutiveIncorrect)),
    difficulty: clamp(typeof state?.difficulty === 'number' ? state.difficulty : DEFAULT_SRS_STATE.difficulty, 0.15, 0.95),
    stability: Math.max(0, typeof state?.stability === 'number' ? state.stability : DEFAULT_SRS_STATE.stability),
    retrievability: clamp(typeof state?.retrievability === 'number' ? state.retrievability : DEFAULT_SRS_STATE.retrievability, 0, 1),
    lastReviewAt: state?.lastReviewAt ?? DEFAULT_SRS_STATE.lastReviewAt,
    lastRating: state?.lastRating ?? DEFAULT_SRS_STATE.lastRating,
    nextReviewAt: state?.nextReviewAt ?? DEFAULT_SRS_STATE.nextReviewAt,
  };
}

export function normalizeVerseProgress(verseProgress: VerseProgress): VerseProgress {
  return {
    ...verseProgress,
    srs: normalizeSrsState(verseProgress.srs),
  };
}

export function getReviewRating(signal: ReviewSignal): VerseReviewRating {
  if (!signal.correct) {
    return 'again';
  }

  const precision = clamp(signal.precision ?? 1, 0, 1);
  const hintsPenalty = Math.min(signal.hintsUsed ?? 0, 4) * 0.07;
  const revealPenalty = clamp(signal.revealedRatio ?? 0, 0, 1) * 0.3;
  const pastePenalty = signal.inputLikelyPasted ? 0.45 : 0;
  const adjustedConfidence = precision - hintsPenalty - revealPenalty - pastePenalty;

  if (adjustedConfidence >= 0.94) {
    return 'easy';
  }

  if (adjustedConfidence >= 0.82) {
    return 'good';
  }

  return 'hard';
}

function getInitialIntervalDays(rating: VerseReviewRating): number {
  switch (rating) {
    case 'easy':
      return 4;
    case 'good':
      return 2;
    case 'hard':
      return 1;
    default:
      return 0;
  }
}

function getFailureDelayMs(lapseCount: number): number {
  const minutes = Math.min(10 + lapseCount * 8, 60);
  return minutes * MINUTES;
}

function getDifficultyDelta(rating: VerseReviewRating): number {
  switch (rating) {
    case 'easy':
      return -0.08;
    case 'good':
      return -0.03;
    case 'hard':
      return 0.06;
    default:
      return 0.14;
  }
}

function getGrowthMultiplier(rating: VerseReviewRating, difficulty: number, consecutiveCorrect: number): number {
  const streakBonus = 1 + Math.min(consecutiveCorrect, 8) * 0.12;
  const difficultyFactor = 1.35 - difficulty;

  switch (rating) {
    case 'easy':
      return 2.4 * streakBonus * difficultyFactor;
    case 'good':
      return 1.8 * streakBonus * difficultyFactor;
    case 'hard':
      return 1.15 * Math.max(0.9, difficultyFactor);
    default:
      return 0.35;
  }
}

export function computeNextSrsState(previousState: VerseSrsState | undefined, signal: ReviewSignal, reviewedAt = new Date()): VerseSrsState {
  const previous = normalizeSrsState(previousState);
  const rating = getReviewRating(signal);
  const nextDifficulty = clamp(previous.difficulty + getDifficultyDelta(rating), 0.15, 0.95);

  if (rating === 'again') {
    return {
      reviewCount: previous.reviewCount + 1,
      lapseCount: previous.lapseCount + 1,
      consecutiveCorrect: 0,
      consecutiveIncorrect: previous.consecutiveIncorrect + 1,
      difficulty: round(nextDifficulty),
      stability: round(Math.max(0.2, previous.stability * 0.45)),
      retrievability: 0.2,
      lastReviewAt: reviewedAt.toISOString(),
      lastRating: rating,
      nextReviewAt: new Date(reviewedAt.getTime() + getFailureDelayMs(previous.lapseCount)).toISOString(),
    };
  }

  const nextConsecutiveCorrect = previous.consecutiveCorrect + 1;
  const initialIntervalDays = getInitialIntervalDays(rating);
  const previousIntervalDays = previous.stability > 0 ? previous.stability : initialIntervalDays;
  const growthMultiplier = getGrowthMultiplier(rating, nextDifficulty, nextConsecutiveCorrect);
  const nextIntervalDays = previous.reviewCount === 0
    ? initialIntervalDays
    : clamp(previousIntervalDays * growthMultiplier, rating === 'hard' ? 1 : 2, 180);

  return {
    reviewCount: previous.reviewCount + 1,
    lapseCount: previous.lapseCount,
    consecutiveCorrect: nextConsecutiveCorrect,
    consecutiveIncorrect: 0,
    difficulty: round(nextDifficulty),
    stability: round(nextIntervalDays),
    retrievability: rating === 'easy' ? 0.97 : rating === 'good' ? 0.93 : 0.86,
    lastReviewAt: reviewedAt.toISOString(),
    lastRating: rating,
    nextReviewAt: new Date(reviewedAt.getTime() + nextIntervalDays * DAYS).toISOString(),
  };
}

export function isVerseDue(verseProgress: VerseProgress, now = new Date()): boolean {
  if (!verseProgress.memorized) {
    return false;
  }

  const nextReviewAt = toDate(verseProgress.srs?.nextReviewAt);
  if (!nextReviewAt) {
    return true;
  }

  return nextReviewAt.getTime() <= now.getTime();
}

export function getDueInDays(verseProgress: VerseProgress, now = new Date()): number {
  const nextReviewAt = toDate(verseProgress.srs?.nextReviewAt);
  if (!nextReviewAt) {
    return 0;
  }

  return Math.ceil((nextReviewAt.getTime() - now.getTime()) / DAYS);
}

export function formatNextReviewLabel(verseProgress: VerseProgress, now = new Date()): string {
  if (!verseProgress.memorized) {
    return 'Not scheduled';
  }

  const nextReviewAt = toDate(verseProgress.srs?.nextReviewAt);
  if (!nextReviewAt) {
    return 'Review now';
  }

  const diffMs = nextReviewAt.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'Review now';
  }

  if (diffMs < HOURS) {
    const minutes = Math.max(1, Math.ceil(diffMs / MINUTES));
    return `In ${minutes} min`;
  }

  if (diffMs < DAYS) {
    const hours = Math.max(1, Math.ceil(diffMs / HOURS));
    return `In ${hours} h`;
  }

  const days = Math.max(1, Math.ceil(diffMs / DAYS));
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
}

export function getSrsSnapshot(verseProgress: VerseProgress, now = new Date()): SrsSnapshot {
  const dueInDays = getDueInDays(verseProgress, now);
  const dueNow = isVerseDue(verseProgress, now);
  const intervalDays = Math.max(0, round(verseProgress.srs?.stability ?? 0));

  return {
    dueNow,
    dueInDays,
    nextReviewLabel: formatNextReviewLabel(verseProgress, now),
    intervalDays,
    urgency: dueNow
      ? (verseProgress.srs?.reviewCount ? 'due' : 'learning')
      : dueInDays <= 2
        ? 'soon'
        : 'scheduled',
  };
}
