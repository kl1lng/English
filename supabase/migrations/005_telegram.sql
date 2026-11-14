-- Phase 2.7: Telegram reminders. A learner links a Telegram chat with a one-time token.
-- Run once in Supabase → SQL Editor, after 004_dialogue.sql. Safe to run twice.
--
-- The learner cannot write chat_id themselves (otherwise anyone could make the bot message
-- an arbitrary chat). Linking happens only in the server webhook, which uses the service key.

create table if not exists public.telegram_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  link_token text unique,
  chat_id bigint,
  last_sent_on date,
  created_at timestamptz not null default now()
);

alter table public.telegram_links enable row level security;
grant select on public.telegram_links to authenticated;

create policy "Users read own telegram link"
  on public.telegram_links for select to authenticated
  using (auth.uid() = user_id);

-- Creates (or renews) a one-time link token for the signed-in learner and returns it.
create or replace function public.create_telegram_link()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  insert into public.telegram_links as t (user_id, link_token)
  values (uid, token)
  on conflict (user_id) do update set link_token = excluded.link_token;
  return token;
end;
$$;

-- Removes the learner's link (stops reminders).
create or replace function public.unlink_telegram()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.telegram_links where user_id = auth.uid();
end;
$$;

revoke all on function public.create_telegram_link() from public;
revoke all on function public.unlink_telegram() from public;
grant execute on function public.create_telegram_link() to authenticated;
grant execute on function public.unlink_telegram() to authenticated;

-- Rollback (do not run unless you want to undo this migration):
--   drop function if exists public.create_telegram_link();
--   drop function if exists public.unlink_telegram();
--   drop table if exists public.telegram_links;
