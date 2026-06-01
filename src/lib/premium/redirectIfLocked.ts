import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPremiumProfile,
  getAccessState,
  shouldLockPremiumTabs,
} from "@/lib/premium";

/** Redirect locked users to dashboard with unlock modal query param. */
export async function redirectIfPremiumLocked() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await fetchPremiumProfile(supabase, user.id);
  const state = getAccessState(profile);

  if (shouldLockPremiumTabs(state)) {
    const unlock = state === "trial_expired" ? "expired" : "new";
    redirect(`/dashboard?unlock=${unlock}`);
  }
}
