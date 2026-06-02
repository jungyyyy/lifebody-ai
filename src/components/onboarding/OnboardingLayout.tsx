"use client";

import { useTranslations } from "next-intl";
import { TOTAL_ONBOARDING_STEPS } from "@/types/onboarding";
import { OnboardingProgress } from "./OnboardingProgress";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function OnboardingLayout({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-white sm:text-xl flex-1">
            <span aria-hidden>🌿</span>
            <span>{t("appName")}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <OnboardingProgress step={step} total={TOTAL_ONBOARDING_STEPS} />

        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
