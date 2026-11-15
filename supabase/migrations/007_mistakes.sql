-- Phase 3 (learning): the learner's grammar mistakes, collected from lesson feedback and
-- conversation reviews. Used for "fix it" practice and the daily focus.
create table if not exists public.learner_mistakes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('lesson', 'dialogue')),
  tag text not null default 'other',
  original text not null,
  corrected text not null,
  lesson_index int,
  created_at timestamptz not null default now(),
  unique (user_id, original, corrected)
);

create index if not exists learner_mistakes_user_idx
  on public.learner_mistakes (user_id, created_at desc);

alter table public.learner_mistakes enable row level security;
grant select, insert on public.learner_mistakes to authenticated;

drop policy if exists "Users read own mistakes" on public.learner_mistakes;
create policy "Users read own mistakes"
  on public.learner_mistakes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users add own mistakes" on public.learner_mistakes;
create policy "Users add own mistakes"
  on public.learner_mistakes for insert to authenticated
  with check (auth.uid() = user_id);

-- Rollback (do not run unless you want to undo this migration):
--   drop table if exists public.learner_mistakes;
