-- Phase 1: spaced-repetition deck (one card per learner and word) and a review history.
-- Already applied to the discover-kazakhstan project on 2026-11-14. Policies are not re-runnable.

create table if not exists public.word_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_key text not null,
  source text not null default 'lesson',
  due timestamptz not null default now(),
  stability real not null default 0,
  difficulty real not null default 0,
  scheduled_days int not null default 0,
  learning_steps int not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  state smallint not null default 0,
  last_review timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, word_key)
);

create index if not exists word_cards_due_idx on public.word_cards (user_id, due);

alter table public.word_cards enable row level security;
grant select, insert, update on public.word_cards to authenticated;

create policy "Users read own cards"
  on public.word_cards for select to authenticated
  using (auth.uid() = user_id);
create policy "Users create own cards"
  on public.word_cards for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update own cards"
  on public.word_cards for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.review_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  word_key text not null,
  rating smallint not null check (rating between 1 and 4),
  state_before smallint,
  mode text not null default 'flip',
  reviewed_at timestamptz not null default now()
);

create index if not exists review_log_user_idx on public.review_log (user_id, reviewed_at desc);

alter table public.review_log enable row level security;
grant select, insert on public.review_log to authenticated;

create policy "Users read own review log"
  on public.review_log for select to authenticated
  using (auth.uid() = user_id);
create policy "Users add own review log"
  on public.review_log for insert to authenticated
  with check (auth.uid() = user_id);

-- Rollback (do not run unless you want to undo this migration):
--   drop table if exists public.review_log;
--   drop table if exists public.word_cards;
