import type { MasteryStage } from './types';

export function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export function getWeekKey(date: Date): string {
  const temp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = temp.getDay() || 7;
  temp.setDate(temp.getDate() + 4 - day);
  const yearStart = new Date(temp.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${temp.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickFromList<T>(items: T[], seed: number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty list');
  }
  return items[seed % items.length];
}

export function getMasteryStage(level: number): MasteryStage {
  if (level >= 5) return 'MASTERED';
  if (level >= 4) return 'SOLID';
  if (level >= 2) return 'STABLE';
  if (level >= 1) return 'CORRECT';
  return 'DISCOVERY';
}

export function shouldTriggerSurprise(seed: number): boolean {
  return seed % 8 === 0;
}

export function getDayDifference(fromDayKey: string, toDayKey: string): number {
  const [fromYear, fromMonth, fromDay] = fromDayKey.split('-').map(Number);
  const [toYear, toMonth, toDay] = toDayKey.split('-').map(Number);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  const diffMs = to - from;
  return Math.floor(diffMs / 86400000);
}
