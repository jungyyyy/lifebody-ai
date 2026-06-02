-- User interface language preference (en | de | ko)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en'
  CHECK (preferred_language IN ('en', 'de', 'ko'));

COMMENT ON COLUMN public.profiles.preferred_language IS 'UI locale: en, de, or ko';
