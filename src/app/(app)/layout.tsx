import { Suspense } from "react";
import { redirect } from "next/navigation";
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
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`${PREMIUM_PROFILE_FIELDS}, nickname`)
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const nickname = profile?.nickname?.trim() || "there";
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
