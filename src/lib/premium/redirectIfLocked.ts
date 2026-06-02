import { localizedRedirect } from "@/lib/i18n/serverRedirect";
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
  if (!user) {
    await localizedRedirect("/login");
    return;
  }

  const profile = await fetchPremiumProfile(supabase, user.id);
  const state = getAccessState(profile);

  if (shouldLockPremiumTabs(state)) {
    const unlock = state === "trial_expired" ? "expired" : "new";
    await localizedRedirect(`/dashboard?unlock=${unlock}`);
  }
}
