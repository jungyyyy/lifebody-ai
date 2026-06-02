"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProgramHeader } from "@/components/program/ProgramHeader";
import { MealPlanTab } from "@/components/program/tabs/MealPlanTab";
import { FitnessTab } from "@/components/program/tabs/FitnessTab";
import { FastingTab } from "@/components/program/tabs/FastingTab";
import { OverviewTab } from "@/components/program/tabs/OverviewTab";
import type { FullProgram } from "@/types/program";

type TabId = "meals" | "fitness" | "fasting" | "overview";

interface ProgramPayload {
  currentWeightKg: number;
  goalWeightKg: number;
  heightCm: number;
  goalBodyLabel: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  programLengthWeeks: number;
  program: FullProgram;
}

export function ProgramPageClient() {
  const t = useTranslations("program");
  const [data, setData] = useState<ProgramPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("meals");

  useEffect(() => {
    fetch("/api/program")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t("loadFailed"));
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : t("loadFailed"))
      );
  }, [t]);

  const programWeeks =
    data?.programLengthWeeks ?? data?.program.program_length_weeks ?? 12;

  const tabs = useMemo(
    () =>
      [
        { id: "meals" as const, label: t("tabMeals") },
        { id: "fitness" as const, label: t("tabFitness") },
        { id: "fasting" as const, label: t("tabFasting") },
        {
          id: "overview" as const,
          label: t("tabOverviewWeeks", { weeks: programWeeks }),
        },
      ],
    [programWeeks, t]
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-gray-500">{t("completeOnboardingHint")}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500 animate-pulse">{t("loadingProgram")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-4">{t("title")}</h1>

      <ProgramHeader
        currentWeightKg={data.currentWeightKg}
        goalWeightKg={data.goalWeightKg}
        goalBodyLabel={data.goalBodyLabel}
        startDate={data.startDate}
        endDate={data.endDate}
        currentWeek={data.currentWeek}
        programLengthWeeks={programWeeks}
      />

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === tabItem.id
                ? "bg-accent text-black"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
        {tab === "meals" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              {t("thisWeekMealPlan")}
            </h2>
            <MealPlanTab
              program={data.program}
              onProgramUpdate={(program) =>
                setData((d) => (d ? { ...d, program } : d))
              }
            />
          </div>
        )}
        {tab === "fitness" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              {t("fitnessPlan")}
            </h2>
            <FitnessTab
              program={data.program}
              onProgramUpdate={(program) =>
                setData((d) => (d ? { ...d, program } : d))
              }
            />
          </div>
        )}
        {tab === "fasting" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              {t("fastingRulesTitle")}
            </h2>
            <FastingTab
              program={data.program}
              heightCm={data.heightCm}
              currentWeightKg={data.currentWeightKg}
            />
          </div>
        )}
        {tab === "overview" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              {t("weeksOverview", { weeks: programWeeks })}
            </h2>
            <OverviewTab
              program={data.program}
              currentWeightKg={data.currentWeightKg}
            />
          </div>
        )}
      </div>
    </div>
  );
}
