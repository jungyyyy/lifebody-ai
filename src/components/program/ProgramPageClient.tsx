"use client";

import { useEffect, useState } from "react";
import { ProgramHeader } from "@/components/program/ProgramHeader";
import { MealPlanTab } from "@/components/program/tabs/MealPlanTab";
import { FitnessTab } from "@/components/program/tabs/FitnessTab";
import { FastingTab } from "@/components/program/tabs/FastingTab";
import { OverviewTab } from "@/components/program/tabs/OverviewTab";
import type { FullProgram } from "@/types/program";

const TABS = [
  { id: "meals", label: "Meal Plan" },
  { id: "fitness", label: "Fitness" },
  { id: "fasting", label: "Fasting & Rules" },
  { id: "overview", label: "12-Week Overview" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ProgramPayload {
  currentWeightKg: number;
  goalWeightKg: number;
  goalBodyLabel: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  program: FullProgram;
}

export function ProgramPageClient() {
  const [data, setData] = useState<ProgramPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("meals");

  useEffect(() => {
    fetch("/api/program")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load program");
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load program")
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-400">{error}</p>
        <p className="mt-2 text-sm text-gray-500">
          Complete onboarding to generate your program.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500 animate-pulse">Loading your program…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 pb-24">
      <h1 className="text-2xl font-semibold text-white mb-4">My Program</h1>

      <ProgramHeader
        currentWeightKg={data.currentWeightKg}
        goalWeightKg={data.goalWeightKg}
        goalBodyLabel={data.goalBodyLabel}
        startDate={data.startDate}
        endDate={data.endDate}
        currentWeek={data.currentWeek}
      />

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-black"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
        {tab === "meals" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              This week&apos;s meal plan
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
            <h2 className="text-lg font-medium text-white mb-4">Fitness plan</h2>
            <FitnessTab program={data.program} />
          </div>
        )}
        {tab === "fasting" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              Fasting &amp; rules
            </h2>
            <FastingTab program={data.program} />
          </div>
        )}
        {tab === "overview" && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4">
              12-week overview
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
