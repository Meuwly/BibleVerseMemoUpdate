export type LeaderboardPlayer = {
  id: string;
  rank: number;
  username: string;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  verses_completed: number;
  quizzes_completed: number;
};

export type FriendChallengeStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
};

export type ProgressOverviewStats = {
  totalVerses: number;
  versesStarted: number;
  versesCompleted: number;
  totalAttempts: number;
  accuracy: string;
  totalXp: number;
  currentLevel: number;
  xpIntoLevel: number;
  xpLevelSpan: number;
  xpProgressPercent: number;
  streakMultiplier: number;
  currentStreak: number;
  bestStreak: number;
  quizzesCompleted: number;
  bestQuizScore: number;
  quizAccuracy: string;
};
