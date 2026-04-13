-- Anti-cheat sync for XP / streak / progress.
-- Run this script in Supabase SQL Editor.
-- It creates a server-authoritative RPC and tightens direct updates.

-- 1) RPC used by the app instead of raw upsert.
create or replace function public.sync_profile_progress(
  p_total_xp integer,
  p_current_streak integer,
  p_best_streak integer,
  p_verses_completed integer,
  p_quizzes_completed integer
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.profiles%rowtype;
  v_now timestamptz := now();

  v_req_total_xp integer := greatest(coalesce(p_total_xp, 0), 0);
  v_req_current_streak integer := greatest(coalesce(p_current_streak, 0), 0);
  v_req_best_streak integer := greatest(coalesce(p_best_streak, 0), 0);
  v_req_verses integer := greatest(coalesce(p_verses_completed, 0), 0);
  v_req_quizzes integer := greatest(coalesce(p_quizzes_completed, 0), 0);

  v_next_total_xp integer;
  v_next_current_streak integer;
  v_next_best_streak integer;
  v_next_verses integer;
  v_next_quizzes integer;

  v_delta_verses integer;
  v_delta_quizzes integer;
  v_allowed_xp_increase integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform set_config('app.profile_sync', 'on', true);

  select *
  into v_existing
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    insert into public.profiles (
      id,
      username,
      total_xp,
      current_streak,
      best_streak,
      verses_completed,
      quizzes_completed,
      updated_at
    )
    values (
      v_user_id,
      coalesce((auth.jwt() ->> 'email')::text, 'user'),
      least(v_req_total_xp, 400),
      least(v_req_current_streak, 1),
      least(greatest(v_req_best_streak, v_req_current_streak), 1),
      least(v_req_verses, 2),
      least(v_req_quizzes, 2),
      v_now
    )
    returning * into v_existing;

    return v_existing;
  end if;

  v_delta_verses := least(greatest(v_req_verses - v_existing.verses_completed, 0), 3);
  v_delta_quizzes := least(greatest(v_req_quizzes - v_existing.quizzes_completed, 0), 3);

  -- Allow XP growth only if progress counters also advance.
  -- Includes a small fixed allowance to absorb rounding/bonus variance.
  v_allowed_xp_increase := (v_delta_verses * 140) + (v_delta_quizzes * 260) + 40;

  v_next_verses := greatest(v_existing.verses_completed, v_existing.verses_completed + v_delta_verses);
  v_next_quizzes := greatest(v_existing.quizzes_completed, v_existing.quizzes_completed + v_delta_quizzes);

  v_next_total_xp := least(v_req_total_xp, v_existing.total_xp + v_allowed_xp_increase);
  v_next_total_xp := greatest(v_next_total_xp, v_existing.total_xp);

  -- A streak can only grow by one per sync.
  v_next_current_streak := least(v_req_current_streak, v_existing.current_streak + 1);
  v_next_current_streak := greatest(v_next_current_streak, v_existing.current_streak);

  -- Best streak cannot decrease and cannot jump by more than one per sync.
  v_next_best_streak := greatest(v_existing.best_streak, v_next_current_streak);
  v_next_best_streak := least(greatest(v_next_best_streak, v_req_best_streak), v_existing.best_streak + 1);

  update public.profiles
  set
    total_xp = v_next_total_xp,
    current_streak = v_next_current_streak,
    best_streak = v_next_best_streak,
    verses_completed = v_next_verses,
    quizzes_completed = v_next_quizzes,
    updated_at = v_now
  where id = v_user_id
  returning * into v_existing;

  return v_existing;
end;
$$;

revoke all on function public.sync_profile_progress(integer, integer, integer, integer, integer) from public;
grant execute on function public.sync_profile_progress(integer, integer, integer, integer, integer) to authenticated;
