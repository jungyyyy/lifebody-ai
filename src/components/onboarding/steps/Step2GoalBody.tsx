"use client";

import { useTranslations } from "next-intl";
import {
  GOAL_BODY_EMOJI,
  GOAL_BODY_IDS,
  goalBodyDescTranslationKey,
  goalBodyTranslationKey,
} from "@/lib/i18n/goalBodyOptions";
import type { GoalBodyType, OnboardingFormData } from "@/types/onboarding";

export function Step2GoalBody({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {GOAL_BODY_IDS.map((id) => {
        const selected = data.goalBodyType === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, goalBodyType: id as GoalBodyType }))
            }
            className={`rounded-xl border p-4 text-left transition-all ${
              selected
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {GOAL_BODY_EMOJI[id]}
            </span>
            <p className="mt-2 font-medium text-white">
              {t(goalBodyTranslationKey(id))}
            </p>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              {t(goalBodyDescTranslationKey(id))}
            </p>
          </button>
        );
      })}
    </div>
  );
}
