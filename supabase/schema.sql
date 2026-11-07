-- Run once in Supabase → SQL Editor for this project.
-- One profile row per user. `data` holds the learner's progress (lessons, attempts, streak).
-- Audio is never stored; only feedback text and metadata go in here.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users create own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create an empty profile automatically when someone registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
