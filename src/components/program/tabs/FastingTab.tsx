"use client";

import { useTranslations } from "next-intl";
import { calculateBmi } from "@/lib/program/bmi";
import type { FullProgram } from "@/types/program";

export function FastingTab({
  program,
  heightCm,
  currentWeightKg,
}: {
  program: FullProgram;
  heightCm: number;
  currentWeightKg: number;
}) {
  const t = useTranslations("program");
  const tCommon = useTranslations("common");
  const bmi = calculateBmi(currentWeightKg, heightCm);
  const isIf = program.fasting_is_intermittent ?? bmi > 25;

  const rules = [
    {
      label: t("dailyCalories"),
      value: `${program.calorie_target} ${tCommon("kcal")} ${t("minCalories")}`,
    },
    {
      label: t("dailyProtein"),
      value: `${program.protein_target_g}${tCommon("g")}`,
    },
    {
      label: t("weeklyFatLoss"),
      value: `${program.weekly_fat_loss_kg} ${tCommon("kg")}/week`,
    },
    {
      label: t("programLength"),
      value: t("weeks", { count: program.program_length_weeks }),
    },
    { label: t("phase"), value: program.phase_label },
    { label: t("yourBmi"), value: bmi.toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
        <h3 className="text-sm font-medium text-accent uppercase tracking-wide">
          {isIf ? t("fastingIF") : t("fastingOvernight")}
        </h3>
        <p className="mt-2 text-sm text-white leading-relaxed">
          {program.fasting_window}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {isIf ? t("fastingIFNote") : t("fastingOvernightNote")}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">{t("programRules")}</h3>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.label}
              className="flex justify-between gap-4 rounded-lg border border-white/10 bg-background px-4 py-3 text-sm"
            >
              <span className="text-gray-400">{r.label}</span>
              <span className="text-white font-medium text-right">{r.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
