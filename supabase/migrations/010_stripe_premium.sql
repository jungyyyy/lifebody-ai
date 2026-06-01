-- Premium subscription fields on profiles (linked to auth.users)

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
