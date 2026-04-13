-- Stockage centralisé des données utilisateurs pour BibleVerseMemo
-- À exécuter dans Supabase SQL Editor
-- Ce script évite les opérations destructives (pas de DROP POLICY).

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  storage jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'user_app_state_select_own'
  ) then
    create policy user_app_state_select_own
      on public.user_app_state
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'user_app_state_insert_own'
  ) then
    create policy user_app_state_insert_own
      on public.user_app_state
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'user_app_state_update_own'
  ) then
    create policy user_app_state_update_own
      on public.user_app_state
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'user_app_state_delete_own'
  ) then
    create policy user_app_state_delete_own
      on public.user_app_state
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

create index if not exists idx_user_app_state_updated_at on public.user_app_state(updated_at desc);
