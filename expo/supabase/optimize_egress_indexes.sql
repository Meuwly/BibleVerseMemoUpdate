-- Indexes that support the egress-reduction optimizations introduced in the
-- optimize-supabase-egress PR set.
--
-- 1. Leaderboard sort index
--    The leaderboard query is:
--      SELECT id, username, total_xp, ... FROM profiles
--      ORDER BY total_xp DESC LIMIT 50
--    Without an index PostgreSQL does a full table scan + sort.  A partial
--    index on total_xp DESC lets it skip the sort entirely and stop after 50
--    rows using an index scan.
--
-- 2. Incremental verse_progress sync index
--    The incremental sync introduced in appStorage.ts issues:
--      SELECT ... FROM verse_progress
--      WHERE user_id = $1 AND updated_at > $2
--      ORDER BY updated_at DESC
--    The existing idx_verse_progress_lookup(user_id, completed, memorized,
--    updated_at desc) cannot satisfy this as a range-then-order scan because
--    completed/memorized sit between user_id and updated_at in the key.
--    A dedicated (user_id, updated_at DESC) index handles both the full fetch
--    (ORDER BY updated_at DESC for a given user) and the incremental fetch
--    (user_id = X AND updated_at > Y ORDER BY updated_at DESC).

create index if not exists idx_profiles_leaderboard
  on public.profiles (total_xp desc);

create index if not exists idx_verse_progress_incremental_sync
  on public.verse_progress (user_id, updated_at desc);
