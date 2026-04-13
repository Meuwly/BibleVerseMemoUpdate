-- Core Supabase schema for BibleVerseMemo.
-- Run this before the feature-specific SQL scripts.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  verses_completed integer not null default 0 check (verses_completed >= 0),
  quizzes_completed integer not null default 0 check (quizzes_completed >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint friend_requests_sender_receiver_check check (sender_id <> receiver_id)
);

create table if not exists public.friends (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, friend_id),
  constraint friends_not_self check (user_id <> friend_id)
);

create unique index if not exists friend_requests_pending_unique_idx
  on public.friend_requests (sender_id, receiver_id)
  where status = 'pending';

create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username));

create index if not exists friend_requests_receiver_status_idx
  on public.friend_requests (receiver_id, status, created_at desc);

create index if not exists friends_lookup_idx
  on public.friends (user_id, friend_id);

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;

create or replace function public.guard_profile_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := regexp_replace(btrim(new.username), '\s+', ' ', 'g');

  if char_length(new.username) < 3 or char_length(new.username) > 32 then
    raise exception 'Username must contain between 3 and 32 characters';
  end if;

  if new.username !~ '^[[:alnum:] ._-]+$' then
    raise exception 'Username contains invalid characters';
  end if;

  if new.username ~ '^[._ -]' or new.username ~ '[._ -]$' then
    raise exception 'Username cannot start or end with punctuation or spaces';
  end if;

  if tg_op = 'INSERT' then
    if current_setting('app.profile_sync', true) = 'on' then
      new.updated_at := coalesce(new.updated_at, timezone('utc', now()));
      return new;
    end if;

    if auth.uid() is distinct from new.id then
      raise exception 'Cannot create a profile for another user';
    end if;

    if new.total_xp <> 0
      or new.current_streak <> 0
      or new.best_streak <> 0
      or new.verses_completed <> 0
      or new.quizzes_completed <> 0 then
      raise exception 'Profile stats must be initialized on the server';
    end if;

    new.updated_at := coalesce(new.updated_at, timezone('utc', now()));
    return new;
  end if;

  if current_setting('app.profile_sync', true) = 'on' then
    new.updated_at := coalesce(new.updated_at, timezone('utc', now()));
    return new;
  end if;

  if new.id <> old.id then
    raise exception 'Profile id is immutable';
  end if;

  if new.total_xp <> old.total_xp
    or new.current_streak <> old.current_streak
    or new.best_streak <> old.best_streak
    or new.verses_completed <> old.verses_completed
    or new.quizzes_completed <> old.quizzes_completed then
    raise exception 'Profile stats can only be changed by the secure sync RPC';
  end if;

  new.updated_at := coalesce(new.updated_at, timezone('utc', now()));
  return new;
end;
$$;

create or replace function public.guard_friend_request_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if tg_op = 'INSERT' then
    if new.sender_id <> v_actor then
      raise exception 'Only the sender can create a friend request';
    end if;

    if new.receiver_id = v_actor then
      raise exception 'Cannot send a friend request to yourself';
    end if;

    if new.status <> 'pending' then
      raise exception 'Friend requests must start as pending';
    end if;

    new.created_at := coalesce(new.created_at, v_now);
    return new;
  end if;

  if new.id <> old.id
    or new.sender_id <> old.sender_id
    or new.receiver_id <> old.receiver_id
    or new.created_at <> old.created_at then
    raise exception 'Friend request identity fields are immutable';
  end if;

  if old.status = 'pending' and new.status = 'accepted' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can accept a friend request';
    end if;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'rejected' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can reject a friend request';
    end if;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'cancelled' then
    if v_actor <> old.sender_id then
      raise exception 'Only the sender can cancel a friend request';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  raise exception 'Invalid friend request status transition';
end;
$$;

drop trigger if exists guard_friend_request_write on public.friend_requests;
create trigger guard_friend_request_write
before insert or update on public.friend_requests
for each row
execute function public.guard_friend_request_write();

create or replace function public.guard_friendship_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if tg_op = 'INSERT' then
    if new.user_id = new.friend_id then
      raise exception 'Cannot create a self friendship';
    end if;

    if v_actor <> new.user_id and v_actor <> new.friend_id then
      raise exception 'Only participants can create friendship edges';
    end if;

    if not exists (
      select 1
      from public.friend_requests
      where status = 'accepted'
        and (
          (sender_id = new.user_id and receiver_id = new.friend_id)
          or (sender_id = new.friend_id and receiver_id = new.user_id)
        )
    ) then
      raise exception 'Friendship requires an accepted friend request';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if v_actor <> old.user_id and v_actor <> old.friend_id then
      raise exception 'Only participants can remove friendship edges';
    end if;

    return old;
  end if;

  raise exception 'Friendship rows are immutable';
end;
$$;

drop trigger if exists guard_friendship_write on public.friends;
create trigger guard_friendship_write
before insert or update or delete on public.friends
for each row
execute function public.guard_friendship_write();

drop trigger if exists guard_profile_write on public.profiles;
create trigger guard_profile_write
before insert or update on public.profiles
for each row
execute function public.guard_profile_write();

-- Profiles: any authenticated user can read leaderboard data, but only owners can insert/update themselves.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_authenticated'
  ) then
    create policy profiles_select_authenticated
      on public.profiles
      for select
      to authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own'
  ) then
    create policy profiles_insert_own
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;

-- Friend requests: only sender/receiver can read and modify relevant rows.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friend_requests' and policyname = 'friend_requests_select_participants'
  ) then
    create policy friend_requests_select_participants
      on public.friend_requests
      for select
      to authenticated
      using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friend_requests' and policyname = 'friend_requests_insert_sender'
  ) then
    create policy friend_requests_insert_sender
      on public.friend_requests
      for insert
      to authenticated
      with check (auth.uid() = sender_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friend_requests' and policyname = 'friend_requests_update_participants'
  ) then
    create policy friend_requests_update_participants
      on public.friend_requests
      for update
      to authenticated
      using (auth.uid() = sender_id or auth.uid() = receiver_id)
      with check (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;
end
$$;

-- Friends: only participants can see/create their own edges.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friends' and policyname = 'friends_select_participants'
  ) then
    create policy friends_select_participants
      on public.friends
      for select
      to authenticated
      using (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friends' and policyname = 'friends_insert_participants'
  ) then
    create policy friends_insert_participants
      on public.friends
      for insert
      to authenticated
      with check (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friends' and policyname = 'friends_delete_participants'
  ) then
    create policy friends_delete_participants
      on public.friends
      for delete
      to authenticated
      using (auth.uid() = user_id or auth.uid() = friend_id);
  end if;
end
$$;
