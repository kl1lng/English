-- Phase 2: experience points, badges, streak freezes and the daily goal.
-- Run once in Supabase → SQL Editor, after 002_word_cards.sql. Safe to run twice.

create table if not exists public.player_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp int not null default 0,
  freezes int not null default 0,
  badges jsonb not null default '[]'::jsonb,
  daily_goal text not null default 'lesson' check (daily_goal in ('lesson', 'lesson+review')),
  tz text not null default 'Asia/Oral',
  extra jsonb not null default '{}'::jsonb,  -- freezeDays, lastFreezeStreak, daily counters, reviewsTotal
  updated_at timestamptz not null default now()
);

alter table public.player_stats enable row level security;
grant select, insert, update on public.player_stats to authenticated;

create policy "Users read own stats"
  on public.player_stats for select to authenticated
  using (auth.uid() = user_id);
create policy "Users create own stats"
  on public.player_stats for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update own stats"
  on public.player_stats for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: points are written by the learner's own session, so they can be edited by the
-- learner. That is acceptable for a personal progress display. A shared leaderboard
-- would need server-side awarding (see the plan, phase 5).

-- Rollback (do not run unless you want to undo this migration):
--   drop table if exists public.player_stats;
