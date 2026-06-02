import { localizedRedirect } from "@/lib/i18n/serverRedirect";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await localizedRedirect("/login");
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    await localizedRedirect("/dashboard");
  }

  await localizedRedirect("/onboarding");
}
