-- Phase 3: finished speaking-partner conversations. Only the review is stored
-- (strengths, corrections, phrases). The conversation text and the audio are NOT stored.
-- Already applied to the discover-kazakhstan project on 2026-11-14. Policies are not re-runnable.

create table if not exists public.dialogue_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  turns int not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dialogue_sessions_user_idx
  on public.dialogue_sessions (user_id, created_at desc);

alter table public.dialogue_sessions enable row level security;
grant select, insert on public.dialogue_sessions to authenticated;

create policy "Users read own conversations"
  on public.dialogue_sessions for select to authenticated
  using (auth.uid() = user_id);
create policy "Users add own conversations"
  on public.dialogue_sessions for insert to authenticated
  with check (auth.uid() = user_id);

-- Rollback (do not run unless you want to undo this migration):
--   drop table if exists public.dialogue_sessions;
