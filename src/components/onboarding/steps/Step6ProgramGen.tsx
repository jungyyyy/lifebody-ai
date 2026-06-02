"use client";

import { useTranslations } from "next-intl";
import { LoadingDots, PrimaryButton } from "../ui";

export function Step6ProgramGen({
  programWeeks,
  phase,
  error,
  onShowProgram,
}: {
  programWeeks: number;
  phase: "loading" | "done" | "error";
  error: string | null;
  onShowProgram: () => void;
}) {
  const t = useTranslations("onboarding");

  if (phase === "loading") {
    return (
      <div className="py-16 text-center">
        <LoadingDots />
        <p className="mt-6 text-lg font-medium text-white">
          {t("programBuilding", { weeks: programWeeks })}
        </p>
        <p className="mt-3 text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
          {t("programBuildingDesc")}
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-10 text-center space-y-6">
      <div className="text-4xl" aria-hidden>
        ✨
      </div>
      <p className="text-lg font-medium text-white leading-relaxed">
        {t("programDone", { weeks: programWeeks })}
      </p>
      <PrimaryButton onClick={onShowProgram}>{t("showProgram")}</PrimaryButton>
    </div>
  );
}
