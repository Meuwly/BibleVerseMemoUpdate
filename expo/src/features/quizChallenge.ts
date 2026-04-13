import type { QuizCategory } from '../data/quizQuestions';

export type QuizChallengeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type QuizChallengeWinner = 'sender' | 'receiver' | 'tie';

export interface QuizChallengeRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: QuizChallengeStatus;
  category: QuizCategory;
  question_count: number;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  sender_score: number | null;
  sender_completed_at: string | null;
  receiver_score: number | null;
  receiver_completed_at: string | null;
  winner: QuizChallengeWinner | null;
  sender_username?: string;
  receiver_username?: string;
}

export interface QuizChallengeRow extends Omit<QuizChallengeRecord, 'sender_username' | 'receiver_username'> {
  sender?: { username?: string | null } | null;
  receiver?: { username?: string | null } | null;
  sender_username?: string;
  receiver_username?: string;
}

export function normalizeQuizChallengeRecord(row: QuizChallengeRow): QuizChallengeRecord {
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    status: row.status,
    category: row.category,
    question_count: row.question_count,
    created_at: row.created_at,
    accepted_at: row.accepted_at ?? null,
    started_at: row.started_at ?? null,
    completed_at: row.completed_at ?? null,
    sender_score: row.sender_score ?? null,
    sender_completed_at: row.sender_completed_at ?? null,
    receiver_score: row.receiver_score ?? null,
    receiver_completed_at: row.receiver_completed_at ?? null,
    winner: row.winner ?? null,
    sender_username: row.sender_username ?? row.sender?.username ?? undefined,
    receiver_username: row.receiver_username ?? row.receiver?.username ?? undefined,
  };
}

export function getQuizChallengeParticipantName(record: QuizChallengeRecord, userId: string | undefined | null): string {
  if (record.sender_id === userId) {
    return record.receiver_username ?? 'Opponent';
  }

  return record.sender_username ?? 'Opponent';
}

export function getQuizChallengeOpponentScore(record: QuizChallengeRecord, userId: string | undefined | null): number | null {
  if (record.sender_id === userId) {
    return record.receiver_score;
  }

  return record.sender_score;
}

export function getQuizChallengeUserScore(record: QuizChallengeRecord, userId: string | undefined | null): number | null {
  if (record.sender_id === userId) {
    return record.sender_score;
  }

  return record.receiver_score;
}

export function hasQuizChallengeUserSubmitted(record: QuizChallengeRecord, userId: string | undefined | null): boolean {
  return getQuizChallengeUserScore(record, userId) !== null;
}
