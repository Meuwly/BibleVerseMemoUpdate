import type { QuizCategory } from '../../data/quizQuestions';
import type { ChallengeRequestRecord, ChallengeRequestRow } from '../../features/xpChallenge';
import type { QuizChallengeRecord, QuizChallengeRow } from '../../features/quizChallenge';

export interface UserProfile {
  id: string;
  username: string;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  verses_completed: number;
  quizzes_completed: number;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  verses_completed: number;
  quizzes_completed: number;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_username?: string;
}

export interface SyncProgressPayload {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  versesCompleted: number;
  quizzesCompleted: number;
}

export type IncomingChallengeRequest = ChallengeRequestRecord;
export type IncomingQuizChallengeRequest = QuizChallengeRecord;
export type IncomingChallengeRequestRow = ChallengeRequestRow;
export type IncomingQuizChallengeRequestRow = QuizChallengeRow;
export type SendQuizChallengeParams = { receiverId: string; category: QuizCategory; questionCount: number };
