-- Feature polls & votes schema for BibleVerseMemo.
-- Lets the developer push remote polls to users and collect votes with minimal Supabase usage.
--
-- USAGE (developer):
--   1. Run this script once in the Supabase SQL editor.
--   2. Insert a row into `feature_polls` to activate a poll.
--      Example:
--        insert into feature_polls (id, title_fr, title_en, description_fr, description_en, options, notify_url)
--        values (
--          'voice-feature-2024',
--          'Idée de nouvelle fonctionnalité : Voudriez-vous un système de voix naturelle ?',
--          'New feature idea: Would you like a natural voice system?',
--          'Voix naturelle pour la lecture des versets à voix haute.',
--          'Natural voice for reading Bible verses aloud.',
--          '[{"fr":"Oui","en":"Yes"},{"fr":"Non","en":"No"},{"fr":"Peut-être","en":"Maybe"}]',
--          'https://ntfy.sh/YOUR_PRIVATE_TOPIC'   -- optional: leave null if not needed
--        );
--   3. Users will see the poll in Settings > Community Vote.
--   4. Results are readable in the Supabase dashboard via the `feature_vote_counts` view.
--   5. To close a poll: update feature_polls set is_active = false where id = 'voice-feature-2024';
--
-- DEVELOPER NOTIFICATIONS (optional, zero extra cost):
--   Set `notify_url` to an ntfy.sh topic URL (e.g. https://ntfy.sh/bvmvotes-abc123).
--   Install the free ntfy app on your phone and subscribe to that topic.
--   Every vote will silently POST a short message to that URL.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.feature_polls (
  id            text        primary key,
  title_fr      text        not null,
  title_en      text        not null,
  description_fr text,
  description_en text,
  -- Array of bilingual option objects: [{"fr": "Oui", "en": "Yes"}, ...]
  options       jsonb       not null default '[]'::jsonb,
  is_active     boolean     not null default true,
  -- Optional webhook URL (ntfy.sh, Slack, etc.) notified on each new vote
  notify_url    text,
  created_at    timestamptz not null default timezone('utc', now()),
  ends_at       timestamptz
);

create table if not exists public.feature_votes (
  id            uuid        primary key default gen_random_uuid(),
  poll_id       text        not null references public.feature_polls(id) on delete cascade,
  -- Anonymous device UUID (generated on first launch) or authenticated user UUID
  voter_id      text        not null,
  option_index  integer     not null check (option_index >= 0),
  voted_at      timestamptz not null default timezone('utc', now()),
  -- One vote per voter per poll
  unique (poll_id, voter_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists feature_votes_poll_idx on public.feature_votes (poll_id, option_index);

-- ─────────────────────────────────────────────────────────────────────────────
-- Aggregated view (developer dashboard + in-app results)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.feature_vote_counts
  with (security_invoker = true)
as
  select
    poll_id,
    option_index,
    count(*)::integer as votes
  from public.feature_votes
  group by poll_id, option_index;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.feature_polls enable row level security;
alter table public.feature_votes enable row level security;

-- Anyone (including anonymous app users) can read active polls
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feature_polls'
    and policyname = 'feature_polls_select_active'
  ) then
    create policy feature_polls_select_active
      on public.feature_polls
      for select
      using (is_active = true);
  end if;
end $$;

-- Anyone can insert a vote (anon key); uniqueness constraint prevents duplicates
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feature_votes'
    and policyname = 'feature_votes_insert_anon'
  ) then
    create policy feature_votes_insert_anon
      on public.feature_votes
      for insert
      with check (true);
  end if;
end $$;

-- Anyone can read vote counts (needed for in-app results display)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feature_votes'
    and policyname = 'feature_votes_select_all'
  ) then
    create policy feature_votes_select_all
      on public.feature_votes
      for select
      using (true);
  end if;
end $$;

-- Grant view access to anon and authenticated roles
grant select on public.feature_vote_counts to anon, authenticated;
grant select on public.feature_polls to anon, authenticated;
grant insert on public.feature_votes to anon, authenticated;
grant select on public.feature_votes to anon, authenticated;
