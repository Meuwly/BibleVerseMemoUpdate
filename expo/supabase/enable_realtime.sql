-- Enable Supabase Realtime for multiplayer tables.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Without this, postgres_changes listeners in the app receive no events,
-- which is why notifications and friend-request updates only appear after
-- a full app restart.

-- 1. Set REPLICA IDENTITY FULL so UPDATE/DELETE payloads include all columns.
alter table public.friend_requests replica identity full;
alter table public.xp_challenge_requests replica identity full;
alter table public.quiz_challenge_requests replica identity full;

-- 2. Add each table to the supabase_realtime publication.
--    If the table is already a member the statement is a no-op thanks to
--    the IF NOT EXISTS guard.

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname  = 'supabase_realtime'
       and tablename = 'friend_requests'
  ) then
    alter publication supabase_realtime add table public.friend_requests;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname  = 'supabase_realtime'
       and tablename = 'xp_challenge_requests'
  ) then
    alter publication supabase_realtime add table public.xp_challenge_requests;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname  = 'supabase_realtime'
       and tablename = 'quiz_challenge_requests'
  ) then
    alter publication supabase_realtime add table public.quiz_challenge_requests;
  end if;
end
$$;
