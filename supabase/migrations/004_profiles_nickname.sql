-- Run this in Supabase → SQL Editor if nickname is missing from profiles

alter table public.profiles
  add column if not exists nickname text,
  add column if not exists program_started_at timestamptz;

-- Optional: set program_started_at for users who already completed onboarding
update public.profiles
set program_started_at = coalesce(program_started_at, updated_at, created_at)
where onboarding_completed = true
  and program_started_at is null;
