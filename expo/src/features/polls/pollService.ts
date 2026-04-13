import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '../../lib/supabase';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const VOTER_ID_KEY = '@bvm/voter_id';
const VOTED_POLLS_KEY = '@bvm/voted_polls';
const DISMISSED_POLLS_KEY = '@bvm/dismissed_polls';
const POLL_CACHE_KEY = '@bvm/active_poll_cache';
const POLL_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const POLL_AUTO_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ────────────────────────────────────────────────────────────────────

export type PollOption = {
  fr: string;
  en: string;
};

export type FeaturePoll = {
  id: string;
  title_fr: string;
  title_en: string;
  description_fr?: string | null;
  description_en?: string | null;
  options: PollOption[];
  notify_url?: string | null;
  created_at?: string | null;
  ends_at?: string | null;
};

// ─── Poll expiration ──────────────────────────────────────────────────────────

/**
 * Returns true if the poll has passed its expiry date.
 * A poll expires after 7 days from creation, or at ends_at if explicitly set.
 */
export function isPollExpired(poll: FeaturePoll): boolean {
  const now = Date.now();

  if (poll.ends_at) {
    return new Date(poll.ends_at).getTime() < now;
  }

  if (poll.created_at) {
    return new Date(poll.created_at).getTime() + POLL_AUTO_EXPIRE_MS < now;
  }

  return false;
}

export type VoteCount = {
  option_index: number;
  votes: number;
};

export type SubmitVoteResult =
  | { success: true; alreadyVoted: false }
  | { success: false; alreadyVoted: true }
  | { success: false; alreadyVoted: false; error?: string };

// ─── Voter identity ───────────────────────────────────────────────────────────

/**
 * Generates a UUID v4 without any external dependency.
 */
function generateVoterId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the persistent anonymous voter ID for this device.
 * Created on first call and stored in AsyncStorage.
 */
export async function getOrCreateVoterId(): Promise<string> {
  const existing = await AsyncStorage.getItem(VOTER_ID_KEY);
  if (existing) return existing;
  const id = generateVoterId();
  await AsyncStorage.setItem(VOTER_ID_KEY, id);
  return id;
}

// ─── Poll fetching ────────────────────────────────────────────────────────────

/**
 * Fetches the most recent active poll from Supabase.
 * Result is cached in AsyncStorage for 6 hours to minimise Supabase reads.
 * Returns null when Supabase is not configured or no active poll exists.
 */
export async function fetchActivePoll(): Promise<FeaturePoll | null> {
  if (!isSupabaseConfigured) return null;

  // Read from local cache first
  try {
    const raw = await AsyncStorage.getItem(POLL_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { poll: FeaturePoll | null; fetchedAt: number };
      if (Date.now() - cached.fetchedAt < POLL_CACHE_TTL_MS) {
        return cached.poll;
      }
    }
  } catch {
    // Ignore cache read errors
  }

  const { data, error } = await supabase
    .from('feature_polls')
    .select('id, title_fr, title_en, description_fr, description_en, options, notify_url, created_at, ends_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[PollService] Failed to fetch active poll:', error.message);
    return null;
  }

  const poll = (data as FeaturePoll | null) ?? null;

  // Update cache (even when null so we don't hammer Supabase on every render)
  try {
    await AsyncStorage.setItem(POLL_CACHE_KEY, JSON.stringify({ poll, fetchedAt: Date.now() }));
  } catch {
    // Ignore cache write errors
  }

  return poll;
}

/**
 * Forces a fresh fetch by clearing the local cache, then calls fetchActivePoll.
 */
export async function refreshActivePoll(): Promise<FeaturePoll | null> {
  await AsyncStorage.removeItem(POLL_CACHE_KEY);
  return fetchActivePoll();
}

// ─── Vote state ───────────────────────────────────────────────────────────────

async function getVotedPollIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(VOTED_POLLS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function markPollAsVoted(pollId: string): Promise<void> {
  const voted = await getVotedPollIds();
  voted.add(pollId);
  await AsyncStorage.setItem(VOTED_POLLS_KEY, JSON.stringify([...voted]));
}

export async function hasVotedOnPoll(pollId: string): Promise<boolean> {
  const voted = await getVotedPollIds();
  return voted.has(pollId);
}

// ─── Poll dismissal ───────────────────────────────────────────────────────────

async function getDismissedPollIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_POLLS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function dismissPoll(pollId: string): Promise<void> {
  const dismissed = await getDismissedPollIds();
  dismissed.add(pollId);
  await AsyncStorage.setItem(DISMISSED_POLLS_KEY, JSON.stringify([...dismissed]));
}

export async function hasDismissedPoll(pollId: string): Promise<boolean> {
  const dismissed = await getDismissedPollIds();
  return dismissed.has(pollId);
}

// ─── Vote counts ──────────────────────────────────────────────────────────────

/**
 * Fetches aggregated vote counts for a given poll from the `feature_vote_counts` view.
 */
export async function fetchVoteCounts(pollId: string): Promise<VoteCount[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('feature_vote_counts')
    .select('option_index, votes')
    .eq('poll_id', pollId);

  if (error) {
    console.warn('[PollService] Failed to fetch vote counts:', error.message);
    return [];
  }

  return (data as VoteCount[]) ?? [];
}

// ─── Vote submission ──────────────────────────────────────────────────────────

/**
 * Submits a vote for the given poll option.
 *
 * - Prevents duplicates via a local AsyncStorage flag AND a Supabase unique constraint.
 * - Fires an optional webhook notification (fire-and-forget) so the developer
 *   can receive instant alerts without any paid service (e.g. ntfy.sh).
 */
export async function submitVote(
  pollId: string,
  optionIndex: number,
  notifyUrl?: string | null,
): Promise<SubmitVoteResult> {
  if (!isSupabaseConfigured) {
    return { success: false, alreadyVoted: false, error: 'supabase_not_configured' };
  }

  // Fast local duplicate check
  if (await hasVotedOnPoll(pollId)) {
    return { success: false, alreadyVoted: true };
  }

  const voterId = await getOrCreateVoterId();

  const { error } = await supabase.from('feature_votes').insert({
    poll_id: pollId,
    voter_id: voterId,
    option_index: optionIndex,
  });

  if (error) {
    // Unique constraint violation — already voted from a different device/session
    if (error.code === '23505') {
      await markPollAsVoted(pollId);
      return { success: false, alreadyVoted: true };
    }
    console.warn('[PollService] Vote insert failed:', error.message);
    return { success: false, alreadyVoted: false, error: error.message };
  }

  // Persist locally so the UI reflects the voted state instantly
  await markPollAsVoted(pollId);

  // Notify the developer via optional webhook (fire-and-forget, never blocks the UI)
  if (notifyUrl) {
    const optionLabel = `option ${optionIndex}`;
    fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Title': 'BibleVerseMemo — Nouveau vote',
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: `Sondage "${pollId}" — ${optionLabel} reçu.`,
    }).catch(() => {
      // Silently ignore webhook errors; the vote is already saved in Supabase
    });
  }

  return { success: true, alreadyVoted: false };
}
