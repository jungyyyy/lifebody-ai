-- Onboarding responses and generated programs

create table if not exists public.onboarding_data (
  user_id uuid references auth.users on delete cascade primary key,
  current_weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  age integer,
  sex text check (sex in ('male', 'female', 'prefer_not_to_say')),
  goal_body_type text,
  current_body_description text,
  body_assessment jsonb,
  cuisines text,
  sweets_frequency text,
  sports_enjoyed text,
  exercise_frequency text,
  cook_frequency text,
  meals_per_day text,
  eating_schedule text,
  snacks text,
  recent_eating text,
  dietary_restrictions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  block_number integer not null default 1,
  program jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, block_number)
);

alter table public.onboarding_data enable row level security;
alter table public.user_programs enable row level security;

create policy "Users can view own onboarding data"
  on public.onboarding_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own onboarding data"
  on public.onboarding_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own onboarding data"
  on public.onboarding_data for update
  using (auth.uid() = user_id);

create policy "Users can view own programs"
  on public.user_programs for select
  using (auth.uid() = user_id);

create policy "Users can insert own programs"
  on public.user_programs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own programs"
  on public.user_programs for update
  using (auth.uid() = user_id);

-- Keep profiles.goal in sync with goal body type (optional convenience)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists onboarding_data_updated_at on public.onboarding_data;
create trigger onboarding_data_updated_at
  before update on public.onboarding_data
  for each row execute procedure public.set_updated_at();
