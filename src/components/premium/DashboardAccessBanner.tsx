"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AccessState } from "@/lib/premium";
import { trialDaysRemaining } from "@/lib/premium";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing/constants";
import { useAccess } from "./AccessContext";

export function DashboardAccessBanner({
  accessState,
  trialEndsAt,
}: {
  accessState: AccessState;
  trialEndsAt: string | null;
}) {
  const { openUnlockModal } = useAccess();
  const t = useTranslations("dashboard");

  if (accessState === "subscriber") return null;

  if (accessState === "never_trial") {
    return (
      <button
        type="button"
        onClick={() => openUnlockModal("never_trial")}
        className="mb-4 w-full text-left rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent hover:bg-accent/15 transition-colors"
      >
        {t("programReadyBanner")}
      </button>
    );
  }

  if (accessState === "trial_active" && trialEndsAt) {
    const days = trialDaysRemaining(trialEndsAt);
    const label =
      days === 1
        ? t("dayRemaining")
        : t("daysRemaining", { days });
    return (
      <Link
        href="/settings"
        className="mb-4 block rounded-lg border border-white/10 bg-card px-4 py-3 text-sm text-gray-300 hover:border-white/20 transition-colors"
      >
        {t("trialDaysRemaining", { label })}
      </Link>
    );
  }

  if (accessState === "trial_expired") {
    return (
      <button
        type="button"
        onClick={() => openUnlockModal("trial_expired")}
        className="mb-4 w-full text-left rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-500/15 transition-colors"
      >
        {t("trialEndedBanner", { price: SUBSCRIPTION_PRICE_LABEL })}
      </button>
    );
  }

  return null;
}
