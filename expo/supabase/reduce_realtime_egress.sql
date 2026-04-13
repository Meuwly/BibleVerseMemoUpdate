-- Reduce Supabase Realtime egress by switching from REPLICA IDENTITY FULL
-- to DEFAULT on multiplayer tables.
--
-- With FULL, every UPDATE/DELETE broadcasts ALL columns (old + new) via WAL
-- to all connected Realtime clients. With DEFAULT, only the primary key is
-- sent in the old record, significantly reducing per-event payload size.
--
-- This is safe because:
-- 1. The app only reads payload.new (never payload.old) in Realtime handlers.
-- 2. INSERT events always include all columns regardless of REPLICA IDENTITY.
-- 3. Realtime channel filters (sender_id=eq.X) check the NEW record for
--    INSERT/UPDATE events, which always contains all columns.
-- 4. The app never DELETEs rows from these tables (it uses status UPDATEs).
--
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

alter table public.friend_requests replica identity default;
alter table public.xp_challenge_requests replica identity default;
alter table public.quiz_challenge_requests replica identity default;
