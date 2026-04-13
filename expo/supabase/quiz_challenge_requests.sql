create table if not exists public.quiz_challenge_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  category text not null,
  question_count integer not null check (question_count > 0),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sender_score integer,
  sender_completed_at timestamptz,
  receiver_score integer,
  receiver_completed_at timestamptz,
  winner text,
  constraint quiz_challenge_requests_not_self check (sender_id <> receiver_id),
  constraint quiz_challenge_requests_winner_check check (winner in ('sender', 'receiver', 'tie') or winner is null)
);

create index if not exists quiz_challenge_requests_receiver_status_idx
  on public.quiz_challenge_requests (receiver_id, status, created_at desc);

create index if not exists quiz_challenge_requests_participants_status_idx
  on public.quiz_challenge_requests (sender_id, receiver_id, status);

create unique index if not exists quiz_challenge_requests_pair_active_unique_idx
  on public.quiz_challenge_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status in ('pending', 'accepted');

alter table public.quiz_challenge_requests enable row level security;

create or replace function public.guard_quiz_challenge_request_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_sender_score integer;
  v_receiver_score integer;
  v_sender_completed_at timestamptz;
  v_receiver_completed_at timestamptz;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if tg_op = 'INSERT' then
    if new.sender_id <> v_actor then
      raise exception 'Only the sender can create a quiz challenge request';
    end if;

    if new.receiver_id = v_actor then
      raise exception 'Cannot challenge yourself';
    end if;

    if new.status <> 'pending' then
      raise exception 'Quiz challenge requests must start as pending';
    end if;

    if new.accepted_at is not null
      or new.started_at is not null
      or new.completed_at is not null
      or new.sender_score is not null
      or new.sender_completed_at is not null
      or new.receiver_score is not null
      or new.receiver_completed_at is not null
      or new.winner is not null then
      raise exception 'Quiz challenge metadata is server-managed';
    end if;

    new.created_at := coalesce(new.created_at, v_now);
    return new;
  end if;

  if new.id <> old.id
    or new.sender_id <> old.sender_id
    or new.receiver_id <> old.receiver_id
    or new.created_at <> old.created_at
    or new.category <> old.category
    or new.question_count <> old.question_count then
    raise exception 'Quiz challenge identity fields are immutable';
  end if;

  if old.status = 'pending' and new.status = 'accepted' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can accept a quiz challenge';
    end if;

    new.accepted_at := v_now;
    new.started_at := v_now;
    new.completed_at := null;
    new.sender_score := null;
    new.sender_completed_at := null;
    new.receiver_score := null;
    new.receiver_completed_at := null;
    new.winner := null;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'rejected' then
    if v_actor <> old.receiver_id then
      raise exception 'Only the receiver can reject a quiz challenge';
    end if;

    new.accepted_at := null;
    new.started_at := null;
    new.completed_at := null;
    new.sender_score := null;
    new.sender_completed_at := null;
    new.receiver_score := null;
    new.receiver_completed_at := null;
    new.winner := null;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'cancelled' then
    if v_actor <> old.sender_id then
      raise exception 'Only the sender can cancel a pending quiz challenge';
    end if;

    new.accepted_at := null;
    new.started_at := null;
    new.completed_at := null;
    new.sender_score := null;
    new.sender_completed_at := null;
    new.receiver_score := null;
    new.receiver_completed_at := null;
    new.winner := null;
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'accepted' then
    if v_actor <> old.sender_id and v_actor <> old.receiver_id then
      raise exception 'Only participants can submit quiz challenge results';
    end if;

    new.accepted_at := old.accepted_at;
    new.started_at := old.started_at;
    new.completed_at := old.completed_at;
    new.winner := old.winner;

    if v_actor = old.sender_id then
      if old.sender_score is not null then
        raise exception 'Sender result already submitted';
      end if;

      if new.receiver_score is not distinct from old.receiver_score then
        null;
      else
        raise exception 'Cannot edit opponent result';
      end if;

      v_sender_score := greatest(coalesce(new.sender_score, 0), 0);
      new.sender_score := least(v_sender_score, old.question_count);
      new.sender_completed_at := v_now;
      new.receiver_score := old.receiver_score;
      new.receiver_completed_at := old.receiver_completed_at;
    else
      if old.receiver_score is not null then
        raise exception 'Receiver result already submitted';
      end if;

      if new.sender_score is not distinct from old.sender_score then
        null;
      else
        raise exception 'Cannot edit opponent result';
      end if;

      v_receiver_score := greatest(coalesce(new.receiver_score, 0), 0);
      new.receiver_score := least(v_receiver_score, old.question_count);
      new.receiver_completed_at := v_now;
      new.sender_score := old.sender_score;
      new.sender_completed_at := old.sender_completed_at;
    end if;

    if new.sender_score is not null and new.receiver_score is not null then
      new.status := 'completed';
      new.completed_at := v_now;
      v_sender_completed_at := coalesce(new.sender_completed_at, old.sender_completed_at, v_now);
      v_receiver_completed_at := coalesce(new.receiver_completed_at, old.receiver_completed_at, v_now);

      if new.sender_score > new.receiver_score then
        new.winner := 'sender';
      elsif new.receiver_score > new.sender_score then
        new.winner := 'receiver';
      elsif v_sender_completed_at < v_receiver_completed_at then
        new.winner := 'sender';
      elsif v_receiver_completed_at < v_sender_completed_at then
        new.winner := 'receiver';
      else
        new.winner := 'tie';
      end if;
    end if;

    return new;
  end if;

  if new.status = old.status
    and new.accepted_at is not distinct from old.accepted_at
    and new.started_at is not distinct from old.started_at
    and new.completed_at is not distinct from old.completed_at
    and new.sender_score is not distinct from old.sender_score
    and new.sender_completed_at is not distinct from old.sender_completed_at
    and new.receiver_score is not distinct from old.receiver_score
    and new.receiver_completed_at is not distinct from old.receiver_completed_at
    and new.winner is not distinct from old.winner then
    return new;
  end if;

  raise exception 'Invalid quiz challenge status transition';
end;
$$;

drop trigger if exists guard_quiz_challenge_request_write on public.quiz_challenge_requests;
create trigger guard_quiz_challenge_request_write
before insert or update on public.quiz_challenge_requests
for each row
execute function public.guard_quiz_challenge_request_write();

create policy if not exists "quiz challenge participants can read requests"
  on public.quiz_challenge_requests
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy if not exists "authenticated users can create their own quiz requests"
  on public.quiz_challenge_requests
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy if not exists "participants can update their quiz requests"
  on public.quiz_challenge_requests
  for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);
