-- App open analytics for BibleVerseMemo.
-- Tracks each app launch and enables daily aggregation by actor (user/device) and global totals.

create table if not exists public.app_open_events (
  id          uuid primary key default gen_random_uuid(),
  actor_id    text not null,
  actor_type  text not null check (actor_type in ('user', 'device')),
  opened_at   timestamptz not null default timezone('utc', now()),
  opened_on   date generated always as ((opened_at at time zone 'utc')::date) stored
);

create index if not exists app_open_events_opened_on_idx
  on public.app_open_events (opened_on);

create index if not exists app_open_events_day_actor_idx
  on public.app_open_events (opened_on, actor_id);

alter table public.app_open_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'app_open_events'
      and policyname = 'app_open_events_insert_all'
  ) then
    create policy app_open_events_insert_all
      on public.app_open_events
      for insert
      with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'app_open_events'
      and policyname = 'app_open_events_select_all'
  ) then
    create policy app_open_events_select_all
      on public.app_open_events
      for select
      using (true);
  end if;
end $$;

grant insert on public.app_open_events to anon, authenticated;
grant select on public.app_open_events to anon, authenticated;
