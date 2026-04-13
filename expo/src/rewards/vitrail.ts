import type { MasteryStage } from './types';

export const vitrailPalette: Record<MasteryStage, { base: string; glow: string }> = {
  DISCOVERY: { base: '#94A3B8', glow: '#E2E8F0' },
  CORRECT: { base: '#60A5FA', glow: '#BFDBFE' },
  STABLE: { base: '#34D399', glow: '#BBF7D0' },
  SOLID: { base: '#A78BFA', glow: '#DDD6FE' },
  MASTERED: { base: '#F59E0B', glow: '#FDE68A' },
};
