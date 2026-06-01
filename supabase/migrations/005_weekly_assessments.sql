create table if not exists public.weekly_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_number integer not null,
  period_start date not null,
  period_end date not null,
  assessment jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_number)
);

create index if not exists weekly_assessments_user_idx
  on public.weekly_assessments (user_id, week_number desc);

alter table public.weekly_assessments enable row level security;

create policy "Users manage own weekly assessments"
  on public.weekly_assessments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
