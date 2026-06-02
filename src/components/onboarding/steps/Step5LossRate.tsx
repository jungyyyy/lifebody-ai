"use client";

import { useTranslations } from "next-intl";
import type { OnboardingFormData } from "@/types/onboarding";

const OPTIONS = [
  { value: "0.5", emoji: "🐢", titleKey: "lossRateSlow", descKey: "lossRateSlowDesc" },
  { value: "0.6", emoji: "🚶", titleKey: "lossRateNormal", descKey: "lossRateNormalDesc" },
  { value: "0.7", emoji: "🏃", titleKey: "lossRateFast", descKey: "lossRateFastDesc" },
] as const;

export function Step5LossRate({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="grid gap-3">
      {OPTIONS.map((opt) => {
        const selected = data.weeklyLossRateKg === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, weeklyLossRateKg: opt.value }))
            }
            className={`rounded-xl border p-4 text-left transition-all ${
              selected
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {opt.emoji}
            </span>
            <p className="mt-2 font-medium text-white">{t(opt.titleKey)}</p>
            <p className="mt-1 text-sm text-gray-400">{t(opt.descKey)}</p>
          </button>
        );
      })}
    </div>
  );
}
