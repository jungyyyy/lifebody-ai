import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { PaymentSuccessToast } from "@/components/premium/PaymentSuccessToast";
import {
  getAccessState,
  isPremiumActive,
  PREMIUM_PROFILE_FIELDS,
} from "@/lib/premium";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(`${PREMIUM_PROFILE_FIELDS}, nickname`)
    .eq("id", user!.id)
    .single();

  const accessState = getAccessState(profile);

  return (
    <>
      <Suspense fallback={null}>
        <PaymentSuccessToast />
      </Suspense>
      <DashboardHome
        initialNickname={profile?.nickname?.trim() || "there"}
        accessState={accessState}
        trialEndsAt={profile?.trial_ends_at ?? null}
        premiumActive={isPremiumActive(profile)}
      />
    </>
  );
}
