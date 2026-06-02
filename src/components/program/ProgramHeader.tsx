"use client";

import { useTranslations } from "next-intl";
import { formatShortDate } from "@/lib/program/dates";

export function ProgramHeader({
  currentWeightKg,
  goalWeightKg,
  goalBodyLabel,
  startDate,
  endDate,
  currentWeek,
  programLengthWeeks,
}: {
  currentWeightKg: number;
  goalWeightKg: number;
  goalBodyLabel: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  programLengthWeeks: number;
}) {
  const t = useTranslations("program");
  const tCommon = useTranslations("common");

  const pct = Math.min(
    100,
    (currentWeek / Math.max(1, programLengthWeeks)) * 100
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t("headerCurrent")}
          </p>
          <p className="text-xl font-semibold text-white mt-1">
            {currentWeightKg}{" "}
            <span className="text-sm font-normal text-gray-400">
              {tCommon("kg")}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t("headerGoal")}
          </p>
          <p className="text-xl font-semibold text-accent mt-1">
            {goalWeightKg}{" "}
            <span className="text-sm font-normal text-gray-400">
              {tCommon("kg")}
            </span>
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t("headerBodyGoal")}
          </p>
          <p className="text-sm font-medium text-white mt-1">{goalBodyLabel}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t("headerProgram")}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            {formatShortDate(startDate)} – {formatShortDate(endDate)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-400">
            {tCommon("weekOf", { week: currentWeek, total: programLengthWeeks })}
          </span>
          <span className="text-accent font-medium">{Math.round(pct)}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
