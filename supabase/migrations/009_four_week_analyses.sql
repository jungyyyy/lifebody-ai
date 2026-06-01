alter table public.profiles
  add column if not exists last_4week_analysis_at date;

create table if not exists public.four_week_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  block_number integer not null,
  week_range text not null,
  period_start date not null,
  period_end date not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, block_number)
);

create index if not exists four_week_analyses_user_idx
  on public.four_week_analyses (user_id, created_at desc);

alter table public.four_week_analyses enable row level security;

create policy "Users manage own four week analyses"
  on public.four_week_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.four_week_analyses to authenticated;
grant all on public.four_week_analyses to service_role;
