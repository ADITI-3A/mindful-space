-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);
alter table public.chat_logs enable row level security;
create policy "chat_select_own" on public.chat_logs for select using (auth.uid() = user_id);
create policy "chat_insert_own" on public.chat_logs for insert with check (auth.uid() = user_id);

create table public.screening_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood int check (mood between 1 and 10),
  phq9_score int not null,
  severity text not null,
  answers jsonb not null,
  created_at timestamptz default now()
);
alter table public.screening_results enable row level security;
create policy "screen_select_own" on public.screening_results for select using (auth.uid() = user_id);
create policy "screen_insert_own" on public.screening_results for insert with check (auth.uid() = user_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz default now()
);
alter table public.appointments enable row level security;
create policy "appt_select_own" on public.appointments for select using (auth.uid() = user_id);
create policy "appt_insert_own" on public.appointments for insert with check (auth.uid() = user_id);
create policy "appt_update_own" on public.appointments for update using (auth.uid() = user_id);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz default now()
);
alter table public.forum_posts enable row level security;
create policy "forum_select_all" on public.forum_posts for select using (true);
create policy "forum_insert_own" on public.forum_posts for insert with check (auth.uid() = user_id);
create policy "forum_delete_own" on public.forum_posts for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.forum_posts;
alter table public.forum_posts replica identity full;