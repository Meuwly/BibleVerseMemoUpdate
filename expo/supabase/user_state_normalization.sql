-- Progressive normalization of user state.
-- Run this after base_schema.sql and user_app_state.sql.
-- Strategy:
-- 1. keep user_app_state.storage as the compatibility snapshot;
-- 2. progressively dual-write dedicated tables;
-- 3. prefer dedicated tables when available, but never destructively delete the legacy blob.

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'LSG',
  learning_mode text not null default 'guess-verse' check (learning_mode in ('guess-verse', 'guess-reference')),
  theme text not null default 'light',
  dyslexia_settings jsonb not null default '{"fontSize":18,"lineHeight":32,"wordSpacing":0}'::jsonb,
  validation_settings jsonb not null default '{"toleranceLevel":0.85,"allowLetterInversion":false,"ignorePunctuation":true,"ignoreAccents":true}'::jsonb,
  appearance_settings jsonb not null default '{"animationsEnabled":true,"showStartupVerse":true,"enableVerseComparison":false,"comparisonVersion":null}'::jsonb,
  learning_settings jsonb not null default '{"autoAdvance":false,"showHints":true,"maxHints":90,"autoMarkMemorized":true,"autoMarkThreshold":5,"hapticFeedback":true,"maxMasteryLevel":20}'::jsonb,
  tts_settings jsonb not null default '{"speed":"normal"}'::jsonb,
  notification_settings jsonb not null default '{"dailyReminderEnabled":false,"dailyReminderHour":19,"dailyReminderMinute":0,"streakWarningEnabled":true}'::jsonb,
  custom_versions jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.verse_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  attempts integer not null default 0 check (attempts >= 0),
  correct_guesses integer not null default 0 check (correct_guesses >= 0 and correct_guesses <= attempts),
  last_practiced timestamptz not null default timezone('utc', now()),
  completed boolean not null default false,
  started boolean not null default false,
  mastery_level integer not null default 0 check (mastery_level >= 0 and mastery_level <= 100),
  memorized boolean not null default false,
  srs jsonb,
  client_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, book, chapter, verse)
);

create table if not exists public.user_quiz_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  questions_answered integer not null default 0 check (questions_answered >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0 and correct_answers <= questions_answered),
  best_score integer not null default 0 check (best_score >= 0),
  last_played_at timestamptz,
  client_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_streak_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0 and best_streak >= current_streak),
  last_activity_date date,
  client_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_streak_last_activity_consistency check (
    (last_activity_date is null and current_streak = 0)
    or last_activity_date is not null
  )
);

create table if not exists public.user_reward_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  vitrail jsonb not null default '{}'::jsonb,
  cards jsonb not null default '{"list":[]}'::jsonb,
  client_updated_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.verse_review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  attempts integer not null default 0 check (attempts >= 0),
  correct_guesses integer not null default 0 check (correct_guesses >= 0 and correct_guesses <= attempts),
  mastery_level integer not null default 0 check (mastery_level >= 0 and mastery_level <= 100),
  completed boolean not null default false,
  memorized boolean not null default false,
  reviewed_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  total_questions integer not null default 0 check (total_questions >= 0 and score <= total_questions),
  earned_xp integer not null default 0 check (earned_xp >= 0),
  attempted_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('streak_advanced', 'streak_reset', 'streak_updated')),
  previous_streak integer not null default 0 check (previous_streak >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0 and best_streak >= current_streak),
  event_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  verse_id text,
  occurred_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_preferences_updated_at on public.user_preferences(updated_at desc);
create index if not exists idx_verse_progress_lookup on public.verse_progress(user_id, completed, memorized, updated_at desc);
create index if not exists idx_user_quiz_stats_updated_at on public.user_quiz_stats(updated_at desc);
create index if not exists idx_user_streak_state_updated_at on public.user_streak_state(updated_at desc);
create index if not exists idx_user_reward_state_updated_at on public.user_reward_state(updated_at desc);
create index if not exists idx_verse_review_events_user_reviewed on public.verse_review_events(user_id, reviewed_at desc);
create index if not exists idx_quiz_attempts_user_attempted on public.quiz_attempts(user_id, attempted_at desc);
create index if not exists idx_streak_events_user_created on public.streak_events(user_id, created_at desc);
create index if not exists idx_reward_events_user_occurred on public.reward_events(user_id, occurred_at desc);

alter table public.user_preferences enable row level security;
alter table public.verse_progress enable row level security;
alter table public.user_quiz_stats enable row level security;
alter table public.user_streak_state enable row level security;
alter table public.user_reward_state enable row level security;
alter table public.verse_review_events enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.streak_events enable row level security;
alter table public.reward_events enable row level security;

do $$
declare
  table_name text;
  event_tables text[] := array[
    'user_preferences',
    'verse_progress',
    'user_quiz_stats',
    'user_streak_state',
    'user_reward_state',
    'verse_review_events',
    'quiz_attempts',
    'streak_events',
    'reward_events'
  ];
begin
  foreach table_name in array event_tables
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_select_own'
    ) then
      execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', table_name || '_select_own', table_name);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_insert_own'
    ) then
      execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', table_name || '_insert_own', table_name);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_update_own'
    ) then
      execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name || '_update_own', table_name);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_delete_own'
    ) then
      execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', table_name || '_delete_own', table_name);
    end if;
  end loop;
end
$$;

create or replace function public.guard_user_owned_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() then
      raise exception 'Cannot write another user''s row';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id then
      raise exception 'user_id is immutable';
    end if;

    if new.user_id <> auth.uid() then
      raise exception 'Cannot update another user''s row';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.user_id <> auth.uid() then
      raise exception 'Cannot delete another user''s row';
    end if;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_row_updated_at();

drop trigger if exists set_verse_progress_updated_at on public.verse_progress;
create trigger set_verse_progress_updated_at
before update on public.verse_progress
for each row execute function public.set_row_updated_at();

drop trigger if exists set_user_quiz_stats_updated_at on public.user_quiz_stats;
create trigger set_user_quiz_stats_updated_at
before update on public.user_quiz_stats
for each row execute function public.set_row_updated_at();

drop trigger if exists set_user_streak_state_updated_at on public.user_streak_state;
create trigger set_user_streak_state_updated_at
before update on public.user_streak_state
for each row execute function public.set_row_updated_at();

drop trigger if exists set_user_reward_state_updated_at on public.user_reward_state;
create trigger set_user_reward_state_updated_at
before update on public.user_reward_state
for each row execute function public.set_row_updated_at();

drop trigger if exists guard_user_preferences_write on public.user_preferences;
create trigger guard_user_preferences_write
before insert or update or delete on public.user_preferences
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_verse_progress_write on public.verse_progress;
create trigger guard_verse_progress_write
before insert or update or delete on public.verse_progress
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_user_quiz_stats_write on public.user_quiz_stats;
create trigger guard_user_quiz_stats_write
before insert or update or delete on public.user_quiz_stats
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_user_streak_state_write on public.user_streak_state;
create trigger guard_user_streak_state_write
before insert or update or delete on public.user_streak_state
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_user_reward_state_write on public.user_reward_state;
create trigger guard_user_reward_state_write
before insert or update or delete on public.user_reward_state
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_verse_review_events_write on public.verse_review_events;
create trigger guard_verse_review_events_write
before insert or update or delete on public.verse_review_events
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_quiz_attempts_write on public.quiz_attempts;
create trigger guard_quiz_attempts_write
before insert or update or delete on public.quiz_attempts
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_streak_events_write on public.streak_events;
create trigger guard_streak_events_write
before insert or update or delete on public.streak_events
for each row execute function public.guard_user_owned_row();

drop trigger if exists guard_reward_events_write on public.reward_events;
create trigger guard_reward_events_write
before insert or update or delete on public.reward_events
for each row execute function public.guard_user_owned_row();
