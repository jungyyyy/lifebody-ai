import type { SupabaseClient } from "@supabase/supabase-js";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing/constants";

export const PREMIUM_PROFILE_FIELDS =
  "is_premium, trial_ends_at, stripe_customer_id, stripe_subscription_id, program_length_weeks, onboarding_completed" as const;

export type PremiumProfile = {
  is_premium?: boolean | null;
  trial_ends_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  program_length_weeks?: number | null;
  onboarding_completed?: boolean | null;
};

/** User access states (onboarding incomplete is handled by middleware/layout). */
export type AccessState =
  | "never_trial"
  | "trial_active"
  | "trial_expired"
  | "subscriber";

export function getAccessState(
  profile: PremiumProfile | null | undefined
): AccessState {
  if (!profile) return "never_trial";

  const trialEnd = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;
  const trialActive = trialEnd != null && trialEnd > new Date();

  if (trialActive) return "trial_active";
  if (profile.is_premium === true) return "subscriber";
  if (trialEnd != null) return "trial_expired";
  return "never_trial";
}

/** Full access: active paid subscription OR trial window still open. */
export function isPremiumActive(
  profile: PremiumProfile | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.is_premium === true) return true;
  if (profile.trial_ends_at) {
    return new Date(profile.trial_ends_at) > new Date();
  }
  return false;
}

export function shouldLockPremiumTabs(state: AccessState): boolean {
  return state === "never_trial" || state === "trial_expired";
}

export function trialDaysRemaining(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function computeTrialEndsAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + TRIAL_PERIOD_DAYS);
  return d.toISOString();
}

export function formatTrialEndDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTrialEndDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function isOnTrial(profile: PremiumProfile | null | undefined): boolean {
  return getAccessState(profile) === "trial_active";
}

export async function fetchPremiumProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<PremiumProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(PREMIUM_PROFILE_FIELDS)
    .eq("id", userId)
    .single();
  return data;
}
