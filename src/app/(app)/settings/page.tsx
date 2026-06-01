import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { PREMIUM_PROFILE_FIELDS } from "@/lib/premium";
import type { Sex } from "@/types/onboarding";

export default async function SettingsRoute() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `${PREMIUM_PROFILE_FIELDS}, nickname, first_name, last_name, avatar_url, date_of_birth`
      )
      .eq("id", user!.id)
      .single(),
    supabase
      .from("onboarding_data")
      .select(
        "current_weight_kg, goal_body_type, cook_frequency, dietary_restrictions, sports_enjoyed, sex"
      )
      .eq("user_id", user!.id)
      .single(),
  ]);

  return (
    <SettingsPage
      email={user!.email ?? ""}
      initialPremium={profile ?? {}}
      initialProfile={{
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        date_of_birth: profile?.date_of_birth ?? null,
        email: user!.email ?? "",
        sex: (onboarding?.sex as Sex) ?? "",
      }}
      initialProgram={{
        current_weight_kg: onboarding?.current_weight_kg ?? null,
        goal_body_type: onboarding?.goal_body_type ?? null,
        cook_frequency: onboarding?.cook_frequency ?? null,
        dietary_restrictions: onboarding?.dietary_restrictions ?? null,
        sports_enjoyed: onboarding?.sports_enjoyed ?? null,
      }}
    />
  );
}
