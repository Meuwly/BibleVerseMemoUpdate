import type { RewardPayload } from './types';
import { getMasteryStage } from './rules';

export function buildVerseId(payload: {
  book: string;
  chapter: number;
  verse: number;
  version: string;
}): string {
  return `${payload.book}-${payload.chapter}-${payload.verse}-${payload.version}`;
}

export function buildReferenceText(payload: {
  bookName: string;
  chapter: number;
  verse: number;
}): string {
  return `${payload.bookName} ${payload.chapter}:${payload.verse}`;
}

export function buildDetailLines(payload: RewardPayload, streakCount: number | null, t: (key: string) => string): string[] {
  const lines: string[] = [];
  if (payload.precision !== undefined) {
    lines.push(`${t('rewardPrecision')}: ${Math.round(payload.precision * 100)}%`);
  }
  if (payload.attempts !== undefined) {
    lines.push(`${t('rewardAttempts')}: ${payload.attempts}`);
  }
  if (payload.masteryAfter !== undefined) {
    const stage = getMasteryStage(payload.masteryAfter);
    lines.push(`${t('rewardMastery')}: ${t(`rewardStage_${stage}`)}`);
  }
  if (streakCount !== null && streakCount > 1) {
    lines.push(`${t('rewardStreak')}: ${streakCount}`);
  }
  return lines;
}
