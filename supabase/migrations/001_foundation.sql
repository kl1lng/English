-- Phase 0: per-user daily usage counters for costly AI calls.
-- Already applied to the discover-kazakhstan project on 2026-11-14. Policies are not re-runnable.

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, kind, day)
);

alter table public.usage_counters enable row level security;

-- Users may read their own counters. Writes happen only through bump_usage().
grant select on public.usage_counters to authenticated;

create policy "Users read own usage"
  on public.usage_counters for select to authenticated
  using (auth.uid() = user_id);

-- Atomically adds 1 for today and tells the caller whether the user is still within p_limit.
-- Returns true when allowed. The counter is not incremented once the limit is reached.
create or replace function public.bump_usage(p_kind text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_count int;
begin
  if uid is null then
    return false;
  end if;

  insert into public.usage_counters as u (user_id, kind, day, count)
  values (uid, p_kind, current_date, 1)
  on conflict (user_id, kind, day)
  do update set count = u.count + 1
    where u.count < p_limit
  returning u.count into new_count;

  return new_count is not null;
end;
$$;

revoke all on function public.bump_usage(text, int) from public;
grant execute on function public.bump_usage(text, int) to authenticated;

-- Rollback (do not run unless you want to undo this migration):
--   drop function if exists public.bump_usage(text, int);
--   drop table if exists public.usage_counters;
