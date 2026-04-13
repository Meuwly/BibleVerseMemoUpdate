export type XpLevelInfo = {
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpIntoLevel: number;
  xpLevelSpan: number;
  xpProgressPercent: number;
};

export function getXpLevelInfo(totalXp: number): XpLevelInfo {
  const safeXp = Math.max(0, totalXp);
  const currentLevel = Math.floor(Math.sqrt(safeXp / 120)) + 1;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 120;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 120;
  const xpIntoLevel = Math.max(safeXp - xpForCurrentLevel, 0);
  const xpLevelSpan = Math.max(xpForNextLevel - xpForCurrentLevel, 1);
  const xpProgressPercent = Math.min((xpIntoLevel / xpLevelSpan) * 100, 100);

  return {
    currentLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    xpIntoLevel,
    xpLevelSpan,
    xpProgressPercent,
  };
}
