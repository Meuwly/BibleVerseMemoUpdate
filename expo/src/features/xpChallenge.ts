import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_XP_CHALLENGE_KEY = '@xp_challenge_active';
const LAST_XP_CHALLENGE_RESULT_KEY = '@xp_challenge_last_result';
const LAST_SEEN_XP_CHALLENGE_RESULT_KEY = '@xp_challenge_last_seen_result';

export const MAX_XP_CHALLENGE_DURATION_MINUTES = 7 * 24 * 60;

export const XP_CHALLENGE_DURATION_OPTIONS = [15, 30, 60, 24 * 60, 3 * 24 * 60, MAX_XP_CHALLENGE_DURATION_MINUTES] as const;

export function formatXpChallengeDuration(
  durationMinutes: number,
  labels: { dayShort: string; hourShort: string; minuteShort: string } = { dayShort: 'd', hourShort: 'h', minuteShort: 'min' },
): string {
  if (durationMinutes >= 24 * 60 && durationMinutes % (24 * 60) === 0) {
    return `${durationMinutes / (24 * 60)}${labels.dayShort}`;
  }

  if (durationMinutes >= 60 && durationMinutes % 60 === 0) {
    return `${durationMinutes / 60}${labels.hourShort}`;
  }

  return `${durationMinutes} ${labels.minuteShort}`;
}

export interface ChallengeParticipant {
  id: string;
  username: string;
  startXp: number;
  startVersesCompleted: number;
}

export interface ActiveXpChallenge {
  id: string;
  startedAt: string;
  endsAt: string;
  durationMinutes: number;
  challenger: ChallengeParticipant;
  opponent: ChallengeParticipant;
}

export type ChallengeRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface ChallengeRequestRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: ChallengeRequestStatus;
  duration_minutes: number;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  ends_at: string | null;
  completed_at: string | null;
  challenger_start_xp: number | null;
  challenger_start_verses_completed: number | null;
  opponent_start_xp: number | null;
  opponent_start_verses_completed: number | null;
  challenger_final_xp: number | null;
  challenger_final_verses_completed: number | null;
  opponent_final_xp: number | null;
  opponent_final_verses_completed: number | null;
  sender_username?: string;
  receiver_username?: string;
}

export interface ChallengeRequestRow extends ChallengeRequestRecord {
  sender?: { username?: string | null } | null;
  receiver?: { username?: string | null } | null;
}

export type XpChallengeWinner = 'challenger' | 'opponent' | 'tie';

export interface ChallengeLiveSnapshot {
  xp: number;
  versesCompleted: number;
}

export interface FinishedXpChallenge {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  challenger: ChallengeParticipant;
  opponent: ChallengeParticipant;
  challengerFinalXp: number;
  challengerFinalVersesCompleted: number;
  opponentFinalXp: number;
  opponentFinalVersesCompleted: number;
  challengerXpGain: number;
  challengerVerseGain: number;
  opponentXpGain: number;
  opponentVerseGain: number;
  winner: XpChallengeWinner;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function buildActiveChallengeFromRequest(request: ChallengeRequestRecord): ActiveXpChallenge | null {
  if (
    !request.started_at ||
    !request.ends_at ||
    request.challenger_start_xp === null ||
    request.challenger_start_verses_completed === null ||
    request.opponent_start_xp === null ||
    request.opponent_start_verses_completed === null
  ) {
    return null;
  }

  return {
    id: request.id,
    startedAt: request.started_at,
    endsAt: request.ends_at,
    durationMinutes: request.duration_minutes,
    challenger: {
      id: request.sender_id,
      username: request.sender_username ?? 'Challenger',
      startXp: request.challenger_start_xp,
      startVersesCompleted: request.challenger_start_verses_completed,
    },
    opponent: {
      id: request.receiver_id,
      username: request.receiver_username ?? 'Opponent',
      startXp: request.opponent_start_xp,
      startVersesCompleted: request.opponent_start_verses_completed,
    },
  };
}

export function normalizeChallengeRequestRecord(row: ChallengeRequestRow): ChallengeRequestRecord {
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    status: row.status,
    duration_minutes: row.duration_minutes,
    created_at: row.created_at,
    accepted_at: row.accepted_at ?? null,
    started_at: row.started_at ?? null,
    ends_at: row.ends_at ?? null,
    completed_at: row.completed_at ?? null,
    challenger_start_xp: row.challenger_start_xp ?? null,
    challenger_start_verses_completed: row.challenger_start_verses_completed ?? null,
    opponent_start_xp: row.opponent_start_xp ?? null,
    opponent_start_verses_completed: row.opponent_start_verses_completed ?? null,
    challenger_final_xp: row.challenger_final_xp ?? null,
    challenger_final_verses_completed: row.challenger_final_verses_completed ?? null,
    opponent_final_xp: row.opponent_final_xp ?? null,
    opponent_final_verses_completed: row.opponent_final_verses_completed ?? null,
    sender_username: row.sender_username ?? row.sender?.username ?? undefined,
    receiver_username: row.receiver_username ?? row.receiver?.username ?? undefined,
  };
}

export async function saveActiveXpChallenge(challenge: ActiveXpChallenge): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_XP_CHALLENGE_KEY, JSON.stringify(challenge));
}

export async function loadStoredActiveXpChallenge(): Promise<ActiveXpChallenge | null> {
  return safeJsonParse<ActiveXpChallenge>(await AsyncStorage.getItem(ACTIVE_XP_CHALLENGE_KEY));
}

export async function clearActiveXpChallenge(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_XP_CHALLENGE_KEY);
}

export async function loadLastXpChallengeResult(): Promise<FinishedXpChallenge | null> {
  return safeJsonParse<FinishedXpChallenge>(await AsyncStorage.getItem(LAST_XP_CHALLENGE_RESULT_KEY));
}

export async function saveLastXpChallengeResult(result: FinishedXpChallenge): Promise<void> {
  await AsyncStorage.setItem(LAST_XP_CHALLENGE_RESULT_KEY, JSON.stringify(result));
}

export async function clearLastXpChallengeResult(): Promise<void> {
  await AsyncStorage.removeItem(LAST_XP_CHALLENGE_RESULT_KEY);
}

export async function loadLastSeenXpChallengeResultKey(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SEEN_XP_CHALLENGE_RESULT_KEY);
}

export async function markXpChallengeResultAsSeen(result: Pick<FinishedXpChallenge, 'id' | 'finishedAt'>): Promise<void> {
  await AsyncStorage.setItem(LAST_SEEN_XP_CHALLENGE_RESULT_KEY, `${result.id}:${result.finishedAt}`);
}


export function buildFinishedChallengeFromRequest(request: ChallengeRequestRecord): FinishedXpChallenge | null {
  const finishedAt = request.completed_at ?? request.ends_at ?? request.accepted_at ?? request.created_at;

  if (
    request.status !== 'completed' ||
    !request.started_at ||
    !finishedAt ||
    request.challenger_start_xp === null ||
    request.challenger_start_verses_completed === null ||
    request.opponent_start_xp === null ||
    request.opponent_start_verses_completed === null ||
    request.challenger_final_xp === null ||
    request.challenger_final_verses_completed === null ||
    request.opponent_final_xp === null ||
    request.opponent_final_verses_completed === null
  ) {
    return null;
  }

  return buildXpChallengeResult(
    {
      id: request.id,
      startedAt: request.started_at,
      endsAt: request.ends_at ?? finishedAt,
      durationMinutes: request.duration_minutes,
      challenger: {
        id: request.sender_id,
        username: request.sender_username ?? 'Challenger',
        startXp: request.challenger_start_xp,
        startVersesCompleted: request.challenger_start_verses_completed,
      },
      opponent: {
        id: request.receiver_id,
        username: request.receiver_username ?? 'Opponent',
        startXp: request.opponent_start_xp,
        startVersesCompleted: request.opponent_start_verses_completed,
      },
    },
    {
      xp: request.challenger_final_xp,
      versesCompleted: request.challenger_final_verses_completed,
    },
    {
      xp: request.opponent_final_xp,
      versesCompleted: request.opponent_final_verses_completed,
    },
    finishedAt,
  );
}

export function buildXpChallengeResult(
  challenge: ActiveXpChallenge,
  challengerLive: ChallengeLiveSnapshot,
  opponentLive: ChallengeLiveSnapshot,
  finishedAt: string = new Date().toISOString(),
): FinishedXpChallenge {
  const challengerXpGain = Math.max(challengerLive.xp - challenge.challenger.startXp, 0);
  const challengerVerseGain = Math.max(challengerLive.versesCompleted - challenge.challenger.startVersesCompleted, 0);
  const opponentXpGain = Math.max(opponentLive.xp - challenge.opponent.startXp, 0);
  const opponentVerseGain = Math.max(opponentLive.versesCompleted - challenge.opponent.startVersesCompleted, 0);

  let winner: XpChallengeWinner = 'tie';
  if (challengerVerseGain !== opponentVerseGain) {
    winner = challengerVerseGain > opponentVerseGain ? 'challenger' : 'opponent';
  } else if (challengerXpGain !== opponentXpGain) {
    winner = challengerXpGain > opponentXpGain ? 'challenger' : 'opponent';
  }

  return {
    id: challenge.id,
    startedAt: challenge.startedAt,
    finishedAt,
    durationMinutes: challenge.durationMinutes,
    challenger: challenge.challenger,
    opponent: challenge.opponent,
    challengerFinalXp: challengerLive.xp,
    challengerFinalVersesCompleted: challengerLive.versesCompleted,
    opponentFinalXp: opponentLive.xp,
    opponentFinalVersesCompleted: opponentLive.versesCompleted,
    challengerXpGain,
    challengerVerseGain,
    opponentXpGain,
    opponentVerseGain,
    winner,
  };
}
