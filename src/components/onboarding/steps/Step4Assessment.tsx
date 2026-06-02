"use client";

import { useTranslations } from "next-intl";
import type { BodyAssessment, OnboardingFormData } from "@/types/onboarding";
import { LoadingDots, PrimaryButton } from "../ui";

export function Step4Assessment({
  data,
  loading,
  error,
  onReady,
}: {
  data: OnboardingFormData;
  loading: boolean;
  error: string | null;
  onReady: () => void;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");

  function phaseLabel(phase: BodyAssessment["phase"]) {
    switch (phase) {
      case "fat loss":
        return t("phaseFatLoss");
      case "muscle gain":
        return t("phaseMuscleGain");
      case "recomposition":
        return t("phaseRecomposition");
      default:
        return phase;
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingDots />
        <p className="mt-4 text-gray-300">{t("analyzingProfile")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="mt-2 text-gray-500 text-xs">{t("geminiHint")}</p>
      </div>
    );
  }

  const assessment = data.assessment;
  if (!assessment) return null;

  const current = parseFloat(data.currentWeightKg);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-background p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t("assessmentCurrent")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {current}{" "}
              <span className="text-sm font-normal text-gray-400">
                {tCommon("kg")}
              </span>
            </p>
          </div>
          <div className="text-accent text-xl">→</div>
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t("assessmentGoal")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-accent">
              {assessment.goal_weight_kg}{" "}
              <span className="text-sm font-normal text-gray-400">
                {tCommon("kg")}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-card px-3 py-2 text-center">
            <p className="text-xs text-gray-500">{t("estBodyFat")}</p>
            <p className="text-lg font-medium text-white">
              ~{assessment.estimated_body_fat_pct}%
            </p>
          </div>
          <div className="rounded-lg bg-card px-3 py-2 text-center">
            <p className="text-xs text-gray-500">{t("yourPhase")}</p>
            <p className="text-sm font-medium text-accent leading-tight mt-1">
              {phaseLabel(assessment.phase)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{assessment.summary}</p>

      <p className="text-center text-white font-medium">
        {assessment.motivational_close}
      </p>

      <PrimaryButton onClick={onReady}>{t("readyBtn")}</PrimaryButton>
    </div>
  );
}
