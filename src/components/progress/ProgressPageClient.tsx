"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WeeklyAssessmentCta } from "@/components/assessment/WeeklyAssessmentCta";
import { FourWeekAnalysisCta } from "@/components/four-week/FourWeekAnalysisCta";
import { WeightChart } from "@/components/progress/WeightChart";
import type { WeeklyAssessmentData } from "@/types/assessment";
import { formatShortDate } from "@/lib/program/dates";
import type { WeekSportEntry } from "@/lib/dashboard/queries";

interface DeepAnalysisListItem {
  id: string;
  week_range: string;
  period_start: string;
  period_end: string;
  created_at: string;
  on_track: boolean;
  pace: string;
  coach_letter: string;
}

interface AssessmentListItem {
  id: string;
  week_number: number;
  period_start: string;
  period_end: string;
  on_track: boolean;
  assessment: WeeklyAssessmentData;
  created_at: string;
}

interface WeightData {
  points: { date: string; weight: number }[];
  startWeight: number;
  currentWeight: number;
  totalChange: number;
  weekTrend: number | null;
}

export function ProgressPageClient() {
  const t = useTranslations("progress");
  const tCommon = useTranslations("common");
  const [list, setList] = useState<AssessmentListItem[]>([]);
  const [deepList, setDeepList] = useState<DeepAnalysisListItem[]>([]);
  const [weightData, setWeightData] = useState<WeightData | null>(null);
  const [weekSports, setWeekSports] = useState<WeekSportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/assessment").then((r) => r.json()),
      fetch("/api/progress/weights").then((r) => r.json()),
      fetch("/api/dashboard/summary").then((r) => r.json()),
      fetch("/api/four-week-analysis").then((r) => r.json()),
    ])
      .then(([assessments, weights, summary, deep]) => {
        setList(assessments.assessments ?? []);
        setWeightData(weights);
        setWeekSports(summary.weekSports ?? []);
        setDeepList(deep.analyses ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-24">
      <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
      <p className="mt-2 text-sm text-gray-400">{t("subtitle")}</p>

      <div className="mt-6 space-y-3">
        <FourWeekAnalysisCta />
        <WeeklyAssessmentCta />
      </div>

      {loading ? (
        <p className="mt-8 text-gray-500 animate-pulse">{tCommon("loading")}</p>
      ) : (
        <>
          {weightData && (
            <div className="mt-6">
              <WeightChart
                points={weightData.points}
                startWeight={weightData.startWeight}
                currentWeight={weightData.currentWeight}
                totalChange={weightData.totalChange}
                weekTrend={weightData.weekTrend}
              />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              {t("thisWeekActivity")}
            </h2>
            {weekSports.length === 0 ? (
              <p className="text-sm text-gray-500 rounded-xl border border-dashed border-white/10 p-6 text-center">
                {t("noActivityWeek")}
              </p>
            ) : (
              <ul className="space-y-2 rounded-xl border border-white/10 bg-card divide-y divide-white/5">
                {weekSports.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="text-gray-400">
                      {formatShortDate(s.date)}
                    </span>
                    <span className="text-white font-medium">{s.activity}</span>
                    <span className="text-gray-500 tabular-nums">
                      {s.duration_minutes} {tCommon("min")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              {t("deepAnalyses")}
            </h2>
            {deepList.length === 0 ? (
              <p className="text-sm text-gray-500 rounded-xl border border-dashed border-violet-500/20 p-6 text-center mb-8">
                {t("firstFourWeekUnlock")}
              </p>
            ) : (
              <ul className="space-y-3 mb-8">
                {deepList.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/progress/four-week/${item.id}`}
                      className="block rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 hover:border-violet-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-violet-200">
                            {t("deepAnalysisTitle", { range: item.week_range })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatShortDate(item.period_start)} –{" "}
                            {formatShortDate(item.period_end)}
                          </p>
                        </div>
                        <span className="text-xs text-violet-300/80 capitalize shrink-0">
                          {item.pace.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                        {item.coach_letter}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              {t("weeklyAssessmentsTitle")}
            </h2>
            {list.length === 0 ? (
              <p className="text-sm text-gray-500 rounded-xl border border-dashed border-white/10 p-6 text-center">
                {t("noAssessmentsYet")}
              </p>
            ) : (
              <ul className="space-y-3">
                {list.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/progress/${item.id}`}
                      className="block rounded-xl border border-white/10 bg-card p-4 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">
                            {t("weekAssessment", { week: item.week_number })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatShortDate(item.period_start)} –{" "}
                            {formatShortDate(item.period_end)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.on_track
                              ? "bg-accent/15 text-accent"
                              : "bg-amber-500/15 text-amber-200"
                          }`}
                        >
                          {item.on_track ? t("onTrack") : t("review")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                        {item.assessment.motivational_message}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
