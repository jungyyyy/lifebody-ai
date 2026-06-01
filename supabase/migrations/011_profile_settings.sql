-- Extended profile fields for settings page

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_url text,
  add column if not exists date_of_birth date;

-- Create a public "avatars" bucket in Supabase Dashboard → Storage if you use profile photos.
