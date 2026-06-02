# LifeBody AI 🏋️

An AI-powered lifestyle journal and body transformation coach.

Not another diet app. A personal AI that learns your habits, builds a
program around your real life, and guides you toward your goal body
through sustainable lifestyle change.

## Features

- 🎯 Personalized body goal assessment
- 🍽️ AI-generated weekly meal prep plans
- 💬 Conversational food journal (just talk to it naturally)
- 📊 Calorie & protein tracking dashboard
- 🏃 Workout program tailored to your goals
- ⏱️ Fasting tracker
- 📅 Weekly AI assessment & advice
- 🔄 Adaptive program that improves as it learns your behavior

## Tech Stack

- Next.js 14, Tailwind CSS
- Supabase (auth + database)
- Gemini API
- Stripe (premium subscriptions)
- Deployed on Vercel

## Getting Started

1. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your [Supabase](https://supabase.com) project.
3. Run migrations in the Supabase SQL editor:
   - `supabase/migrations/001_profiles.sql`
   - `supabase/migrations/002_onboarding.sql`
   - `supabase/migrations/003_dashboard_logs.sql` (optional if you run 006 below)
   - `supabase/migrations/004_profiles_nickname.sql` (if `nickname` is missing on `profiles`)
   - `supabase/migrations/005_weekly_assessments.sql`
   - `supabase/migrations/006_fix_logs_rls.sql` (creates log tables + RLS — run this if journaling fails)
4. Add `GEMINI_API_KEY` to `.env.local` for AI body assessment and program generation.
5. In Supabase → Authentication → URL Configuration, add your site URL and redirect URL:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
6. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Auth Routes

| Route | Description |
|-------|-------------|
| `/signup` | Create account (email verification) |
| `/login` | Sign in |
| `/forgot-password` | Password reset email |
| `/auth/callback` | Email verification & OAuth callback |
| `/onboarding` | 7-step onboarding wizard (stats → goals → AI assessment → program → paywall) |
| `/dashboard` | Main app (protected) |

## Status

[Try it here!](lifebody-ai.vercel.app)
