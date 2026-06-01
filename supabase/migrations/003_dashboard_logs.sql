-- Profile nickname & program start
alter table public.profiles
  add column if not exists nickname text,
  add column if not exists program_started_at timestamptz;

-- Daily logs
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  meal_type text not null,
  items jsonb not null default '[]',
  total_calories numeric(8, 2) not null default 0,
  total_protein numeric(8, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  weight_kg numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.sport_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  activity text not null,
  duration_minutes integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fasting_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  hours numeric(4, 1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.period_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists food_logs_user_date_idx on public.food_logs (user_id, log_date);
create index if not exists weight_logs_user_date_idx on public.weight_logs (user_id, log_date);
create index if not exists sport_logs_user_date_idx on public.sport_logs (user_id, log_date);

alter table public.food_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.sport_logs enable row level security;
alter table public.fasting_logs enable row level security;
alter table public.period_logs enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.food_logs to authenticated;
grant select, insert, update, delete on public.weight_logs to authenticated;
grant select, insert, update, delete on public.sport_logs to authenticated;
grant select, insert, update, delete on public.fasting_logs to authenticated;
grant select, insert, update, delete on public.period_logs to authenticated;
grant all on public.food_logs to service_role;
grant all on public.weight_logs to service_role;
grant all on public.sport_logs to service_role;
grant all on public.fasting_logs to service_role;
grant all on public.period_logs to service_role;

create policy "food_logs_select" on public.food_logs for select to authenticated using (auth.uid() = user_id);
create policy "food_logs_insert" on public.food_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "food_logs_update" on public.food_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "food_logs_delete" on public.food_logs for delete to authenticated using (auth.uid() = user_id);

create policy "weight_logs_select" on public.weight_logs for select to authenticated using (auth.uid() = user_id);
create policy "weight_logs_insert" on public.weight_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "weight_logs_update" on public.weight_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_logs_delete" on public.weight_logs for delete to authenticated using (auth.uid() = user_id);

create policy "sport_logs_select" on public.sport_logs for select to authenticated using (auth.uid() = user_id);
create policy "sport_logs_insert" on public.sport_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "sport_logs_update" on public.sport_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sport_logs_delete" on public.sport_logs for delete to authenticated using (auth.uid() = user_id);

create policy "fasting_logs_select" on public.fasting_logs for select to authenticated using (auth.uid() = user_id);
create policy "fasting_logs_insert" on public.fasting_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "fasting_logs_update" on public.fasting_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fasting_logs_delete" on public.fasting_logs for delete to authenticated using (auth.uid() = user_id);

create policy "period_logs_select" on public.period_logs for select to authenticated using (auth.uid() = user_id);
create policy "period_logs_insert" on public.period_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "period_logs_update" on public.period_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "period_logs_delete" on public.period_logs for delete to authenticated using (auth.uid() = user_id);
