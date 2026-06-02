"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { FullProgram } from "@/types/program";
import { hasValidFitnessPlan } from "@/lib/program/validatePlans";

export function FitnessTab({
  program,
  onProgramUpdate,
}: {
  program: FullProgram;
  onProgramUpdate: (p: FullProgram) => void;
}) {
  const t = useTranslations("program");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(!hasValidFitnessPlan(program.fitness_plan));
  const [loadError, setLoadError] = useState<string | null>(null);

  const ensureFitnessPlan = useCallback(async () => {
    if (hasValidFitnessPlan(program.fitness_plan)) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/program/ensure-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: "fitness" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("fitnessLoadFailed"));
      onProgramUpdate(json.program);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : t("fitnessLoadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [program.fitness_plan, onProgramUpdate, t]);

  useEffect(() => {
    if (!hasValidFitnessPlan(program.fitness_plan)) {
      ensureFitnessPlan();
    }
  }, [program.fitness_plan, ensureFitnessPlan]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 animate-pulse">{t("buildingFitness")}</p>
        <p className="text-xs text-gray-500 mt-2">{t("fitnessLoadTime")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-red-400 text-sm">{loadError}</p>
        <button
          type="button"
          onClick={ensureFitnessPlan}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black"
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  const plan = program.fitness_plan;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400 leading-relaxed">
        {program.exercise_plan.overview}
      </p>
      <p className="text-sm text-gray-500">
        {t("sessionsPerWeek", { count: plan.sessions_per_week })}
      </p>

      {plan.sessions.map((session) => (
        <div
          key={session.session_name}
          className="rounded-2xl border border-white/10 bg-background p-5 sm:p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">
              {session.session_name}
            </h3>
            <p className="text-sm text-accent mt-0.5">
              {t("focus")} {session.focus}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {session.suggested_days} ·{" "}
              {t("minutesEst", { minutes: session.estimated_duration_minutes })}
            </p>
          </div>

          <div className="space-y-3">
            {session.exercises.map((ex) => (
              <div
                key={`${session.session_name}-${ex.name}`}
                className="rounded-xl border border-white/10 bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{ex.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ex.muscle_group}
                    </p>
                  </div>
                  <p className="text-sm text-accent tabular-nums shrink-0">
                    {t("setsReps", { sets: ex.sets, reps: ex.reps })}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t("restBetween", { seconds: ex.rest_seconds })}
                </p>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {ex.coaching_tip}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500 border-t border-white/10 pt-4 leading-relaxed">
            {t("progressionTip")}
          </p>
        </div>
      ))}
    </div>
  );
}
