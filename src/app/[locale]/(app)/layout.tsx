import { Suspense } from "react";
import { localizedRedirect } from "@/lib/i18n/serverRedirect";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/AppShell";
import { AccessProvider } from "@/components/premium/AccessContext";
import {
  getAccessState,
  PREMIUM_PROFILE_FIELDS,
} from "@/lib/premium";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    .select(`${PREMIUM_PROFILE_FIELDS}, nickname`)
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    await localizedRedirect("/onboarding");
  }

  const t = await getTranslations("common");
  const nickname = profile?.nickname?.trim() || t("there");
  const accessState = getAccessState(profile);

  return (
    <Suspense fallback={null}>
      <AccessProvider
        accessState={accessState}
        programWeeks={profile?.program_length_weeks ?? undefined}
      >
        <AppShell nickname={nickname} accessState={accessState}>
          {children}
        </AppShell>
      </AccessProvider>
    </Suspense>
  );
}
