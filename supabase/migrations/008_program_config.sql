alter table public.profiles
  add column if not exists weekly_loss_rate_kg numeric(3, 2) default 0.6,
  add column if not exists program_length_weeks integer;
