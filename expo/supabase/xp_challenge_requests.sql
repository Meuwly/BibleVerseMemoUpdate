create table if not exists public.xp_challenge_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  duration_minutes integer not null check (duration_minutes between 15 and 10080),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  started_at timestamptz,
  ends_at timestamptz,
  completed_at timestamptz,
  challenger_start_xp integer,
  challenger_start_verses_completed integer,
  opponent_start_xp integer,
  opponent_start_verses_completed integer,
  challenger_final_xp integer,
  challenger_final_verses_completed integer,
  opponent_final_xp integer,
  opponent_final_verses_completed integer,
  winner text check (winner in ('challenger', 'opponent', 'tie')),
  constraint xp_challenge_requests_not_self check (sender_id <> receiver_id)
);

alter table public.xp_challenge_requests
  add column if not exists challenger_final_xp integer;

alter table public.xp_challenge_requests
  add column if not exists challenger_final_verses_completed integer;

alter table public.xp_challenge_requests
  add column if not exists opponent_final_xp integer;

alter table public.xp_challenge_requests
  add column if not exists opponent_final_verses_completed integer;

alter table public.xp_challenge_requests
  add column if not exists winner text;

alter table public.xp_challenge_requests
  drop constraint if exists xp_challenge_requests_winner_check;

alter table public.xp_challenge_requests
  add constraint xp_challenge_requests_winner_check
  check (winner in ('challenger', 'opponent', 'tie') or winner is null);

create index if not exists xp_challenge_requests_receiver_status_idx
  on public.xp_challenge_requests (receiver_id, status, created_at desc);

create index if not exists xp_challenge_requests_participants_status_idx
  on public.xp_challenge_requests (sender_id, receiver_id, status);

create unique index if not exists xp_challenge_requests_pair_active_unique_idx
  on public.xp_challenge_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status in ('pending', 'accepted');

alter table public.xp_challenge_requests enable row level security;

create or replace function public.guard_xp_challenge_request_write()
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
      raise exception 'Only the sender can create a challenge request';
    end if;

    if new.receiver_id = v_actor then
      raise exception 'Cannot challenge yourself';
    end if;

    if new.status <> 'pending' then
      raise exception 'Challenge requests must start as pending';
    end if;

    if new.accepted_at is not null
      or new.started_at is not null
      or new.ends_at is not null
      or new.completed_at is not null
      or new.challenger_start_xp is not null
      or new.challenger_start_verses_completed is not null
      or new.opponent_start_xp is not null
      or new.opponent_start_verses_completed is not null
      or new.challenger_final_xp is not null
      or new.challenger_final_verses_completed is not null
      or new.opponent_final_xp is not null
      or new.opponent_final_verses_completed is not null
      or new.winner is not null then
      raise exception 'Challenge start metadata is server-managed';
    end if;

    new.created_at := coalesce(new.created_at, v_now);
    return new;
  end if;

  if new.id <> old.id
    or new.sender_id <> old.sender_id
    or new.receiver_id <> old.receiver_id
    or new.created_at <> old.created_at
    or new.duration_minutes <> old.duration_minutes then
    raise exception 'Challenge identity fields are immutable';
  end if;

  if old.status = 'pending' and new.status = 'accepted' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can accept a challenge';
    end if;

    new.accepted_at := v_now;
    new.started_at := v_now;
    new.ends_at := v_now + make_interval(mins => old.duration_minutes);
    new.completed_at := null;
    new.challenger_final_xp := null;
    new.challenger_final_verses_completed := null;
    new.opponent_final_xp := null;
    new.opponent_final_verses_completed := null;

    select total_xp, verses_completed
    into new.challenger_start_xp, new.challenger_start_verses_completed
    from public.profiles
    where id = old.sender_id;

    select total_xp, verses_completed
    into new.opponent_start_xp, new.opponent_start_verses_completed
    from public.profiles
    where id = old.receiver_id;

    return new;
  end if;

  if old.status = 'pending' and new.status = 'rejected' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can reject a challenge';
    end if;

    new.accepted_at := null;
    new.started_at := null;
    new.ends_at := null;
    new.completed_at := null;
    new.challenger_start_xp := null;
    new.challenger_start_verses_completed := null;
    new.opponent_start_xp := null;
    new.opponent_start_verses_completed := null;
    new.challenger_final_xp := null;
    new.challenger_final_verses_completed := null;
    new.opponent_final_xp := null;
    new.opponent_final_verses_completed := null;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'cancelled' then
    if v_actor <> old.sender_id then
      raise exception 'Only the sender can cancel a pending challenge';
    end if;

    new.accepted_at := null;
    new.started_at := null;
    new.ends_at := null;
    new.completed_at := null;
    new.challenger_start_xp := null;
    new.challenger_start_verses_completed := null;
    new.opponent_start_xp := null;
    new.opponent_start_verses_completed := null;
    new.challenger_final_xp := null;
    new.challenger_final_verses_completed := null;
    new.opponent_final_xp := null;
    new.opponent_final_verses_completed := null;
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'completed' then
    if v_actor <> old.sender_id and v_actor <> old.receiver_id then
      raise exception 'Only challenge participants can close an active challenge';
    end if;

    new.accepted_at := old.accepted_at;
    new.started_at := old.started_at;
    new.ends_at := old.ends_at;
    new.completed_at := v_now;
    new.challenger_start_xp := old.challenger_start_xp;
    new.challenger_start_verses_completed := old.challenger_start_verses_completed;
    new.opponent_start_xp := old.opponent_start_xp;
    new.opponent_start_verses_completed := old.opponent_start_verses_completed;

    if new.status = 'completed' then
      select total_xp, verses_completed
      into new.challenger_final_xp, new.challenger_final_verses_completed
      from public.profiles
      where id = old.sender_id;

      select total_xp, verses_completed
      into new.opponent_final_xp, new.opponent_final_verses_completed
      from public.profiles
      where id = old.receiver_id;

      if (new.challenger_final_verses_completed - coalesce(old.challenger_start_verses_completed, 0))
         <> (new.opponent_final_verses_completed - coalesce(old.opponent_start_verses_completed, 0)) then
        new.winner := case
          when (new.challenger_final_verses_completed - coalesce(old.challenger_start_verses_completed, 0))
             > (new.opponent_final_verses_completed - coalesce(old.opponent_start_verses_completed, 0))
            then 'challenger'
          else 'opponent'
        end;
      elsif (new.challenger_final_xp - coalesce(old.challenger_start_xp, 0))
         <> (new.opponent_final_xp - coalesce(old.opponent_start_xp, 0)) then
        new.winner := case
          when (new.challenger_final_xp - coalesce(old.challenger_start_xp, 0))
             > (new.opponent_final_xp - coalesce(old.opponent_start_xp, 0))
            then 'challenger'
          else 'opponent'
        end;
      else
        new.winner := 'tie';
      end if;
    else
      new.challenger_final_xp := null;
      new.challenger_final_verses_completed := null;
      new.opponent_final_xp := null;
      new.opponent_final_verses_completed := null;
      new.winner := null;
    end if;

    return new;
  end if;

  if new.status = old.status
    and new.accepted_at is not distinct from old.accepted_at
    and new.started_at is not distinct from old.started_at
    and new.ends_at is not distinct from old.ends_at
    and new.completed_at is not distinct from old.completed_at
    and new.challenger_start_xp is not distinct from old.challenger_start_xp
    and new.challenger_start_verses_completed is not distinct from old.challenger_start_verses_completed
    and new.opponent_start_xp is not distinct from old.opponent_start_xp
    and new.opponent_start_verses_completed is not distinct from old.opponent_start_verses_completed
    and new.challenger_final_xp is not distinct from old.challenger_final_xp
    and new.challenger_final_verses_completed is not distinct from old.challenger_final_verses_completed
    and new.opponent_final_xp is not distinct from old.opponent_final_xp
    and new.opponent_final_verses_completed is not distinct from old.opponent_final_verses_completed
    and new.winner is not distinct from old.winner then
    return new;
  end if;

  raise exception 'Invalid challenge status transition';
end;
$$;

drop trigger if exists guard_xp_challenge_request_write on public.xp_challenge_requests;
create trigger guard_xp_challenge_request_write
before insert or update on public.xp_challenge_requests
for each row
execute function public.guard_xp_challenge_request_write();

create policy if not exists "challenge participants can read requests"
  on public.xp_challenge_requests
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy if not exists "authenticated users can create their own requests"
  on public.xp_challenge_requests
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy if not exists "participants can update their requests"
  on public.xp_challenge_requests
  for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);


alter table public.xp_challenge_requests
  add column if not exists completed_at timestamptz,
  add column if not exists challenger_final_xp integer,
  add column if not exists challenger_final_verses_completed integer,
  add column if not exists opponent_final_xp integer,
  add column if not exists opponent_final_verses_completed integer;

alter table public.xp_challenge_requests
  drop constraint if exists xp_challenge_requests_duration_minutes_check;

alter table public.xp_challenge_requests
  add constraint xp_challenge_requests_duration_minutes_check
  check (duration_minutes between 15 and 10080);
