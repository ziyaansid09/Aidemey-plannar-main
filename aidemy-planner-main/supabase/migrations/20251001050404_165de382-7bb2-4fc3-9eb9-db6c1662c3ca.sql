-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create subjects table
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  priority integer not null default 2 check (priority between 1 and 3),
  color text default '#6366f1',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on subjects
alter table public.subjects enable row level security;

-- Subjects policies
create policy "Users can view own subjects"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "Users can create own subjects"
  on public.subjects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subjects"
  on public.subjects for update
  using (auth.uid() = user_id);

create policy "Users can delete own subjects"
  on public.subjects for delete
  using (auth.uid() = user_id);

-- Create chapters table
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on chapters
alter table public.chapters enable row level security;

-- Chapters policies
create policy "Users can view own chapters"
  on public.chapters for select
  using (auth.uid() = user_id);

create policy "Users can create own chapters"
  on public.chapters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chapters"
  on public.chapters for update
  using (auth.uid() = user_id);

create policy "Users can delete own chapters"
  on public.chapters for delete
  using (auth.uid() = user_id);

-- Create schedules table
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  date date not null,
  task text not null,
  duration integer not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on schedules
alter table public.schedules enable row level security;

-- Schedules policies
create policy "Users can view own schedules"
  on public.schedules for select
  using (auth.uid() = user_id);

create policy "Users can create own schedules"
  on public.schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on public.schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedules"
  on public.schedules for delete
  using (auth.uid() = user_id);

-- Create notes table
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  content text,
  resources text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on notes
alter table public.notes enable row level security;

-- Notes policies
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can create own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Create reminders table
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  message text not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on reminders
alter table public.reminders enable row level security;

-- Reminders policies
create policy "Users can view own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can create own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_subjects
  before update on public.subjects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_chapters
  before update on public.chapters
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_notes
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();