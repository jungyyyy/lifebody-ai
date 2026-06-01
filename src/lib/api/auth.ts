import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  fetchPremiumProfile,
  isPremiumActive,
  type PremiumProfile,
} from "@/lib/premium";

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase,
      profile: null as PremiumProfile | null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, profile: null as PremiumProfile | null, error: null };
}

/** Server-side premium check for AI / program API routes. */
export async function requirePremium() {
  const result = await requireUser();
  if (result.error) {
    return { ...result, premiumError: result.error };
  }

  const profile = await fetchPremiumProfile(result.supabase, result.user!.id);
  if (!isPremiumActive(profile)) {
    return {
      ...result,
      profile,
      premiumError: NextResponse.json(
        { error: "Premium subscription or active trial required" },
        { status: 403 }
      ),
    };
  }

  return { ...result, profile, premiumError: null };
}
