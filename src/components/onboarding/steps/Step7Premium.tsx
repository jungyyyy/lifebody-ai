"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PaywallScreen } from "@/components/premium/PaywallScreen";
import type { OnboardingFormData } from "@/types/onboarding";

export function Step7Premium({
  programWeeks,
  onboardingData,
}: {
  programWeeks: number;
  onboardingData: OnboardingFormData;
}) {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [maybeLaterLoading, setMaybeLaterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeOnboarding() {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(onboardingData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? t("completeFailed"));
  }

  async function handleMaybeLater() {
    setMaybeLaterLoading(true);
    setError(null);
    try {
      await completeOnboarding();
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("somethingWrong"));
      setMaybeLaterLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <PaywallScreen
        programWeeks={programWeeks}
        onMaybeLater={handleMaybeLater}
        maybeLaterLoading={maybeLaterLoading}
        onBeforeCheckout={completeOnboarding}
      />
    </div>
  );
}
