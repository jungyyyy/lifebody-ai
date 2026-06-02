"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/app/ProgressBar";
import type { DashboardSummary } from "@/lib/dashboard/queries";
import { formatDisplayDate, localDateString } from "@/lib/dates";
import type { AccessState } from "@/lib/premium";
import { DashboardAccessBanner } from "@/components/premium/DashboardAccessBanner";
import { WeeklyAssessmentCta } from "@/components/assessment/WeeklyAssessmentCta";
import { FourWeekAnalysisCta } from "@/components/four-week/FourWeekAnalysisCta";
import {
  FastingModal,
  SportModal,
  WeightModal,
} from "./LogModals";

export function DashboardHome({
  initialNickname,
  premiumActive,
  accessState,
  trialEndsAt,
}: {
  initialNickname: string;
  premiumActive: boolean;
  accessState: AccessState;
  trialEndsAt: string | null;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [date] = useState(() => localDateString());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [sportOpen, setSportOpen] = useState(false);
  const [fastingOpen, setFastingOpen] = useState(false);
  const [periodLoading, setPeriodLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard/summary?date=${date}`);
    if (res.ok) setSummary(await res.json());
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const nickname = summary?.nickname || initialNickname;

  async function togglePeriod() {
    if (!summary) return;
    setPeriodLoading(true);
    await fetch("/api/logs/period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !summary.periodActive, date }),
    });
    setPeriodLoading(false);
    load();
  }

  const s = summary;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <DashboardAccessBanner
        accessState={accessState}
        trialEndsAt={trialEndsAt}
      />

      {premiumActive && (
        <div className="space-y-3">
          <FourWeekAnalysisCta />
          <WeeklyAssessmentCta />
        </div>
      )}

      {toast && (
        <div className="mb-4 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
          {toast}
        </div>
      )}
      {warning && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {warning}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-white">
          {t("welcome", { name: nickname })}
        </h1>
        {s && (
          <p className="mt-1 text-sm text-gray-400">
            {formatDisplayDate(s.displayDate)} ·{" "}
            {tCommon("dayOf", {
              day: s.programDay,
              total: s.programTotalDays,
            })}{" "}
            ·{" "}
            {tCommon("weekOf", {
              week: Math.min(
                s.programLengthWeeks,
                Math.ceil(s.programDay / 7)
              ),
              total: s.programLengthWeeks,
            })}
          </p>
        )}
      </div>

      {s?.periodActive && (
        <p className="mt-4 rounded-lg border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">
          {t("periodNote")}
        </p>
      )}

      <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
        {s ? (
          <>
            <ProgressBar
              label={t("caloriesToday")}
              value={s.todayCalories}
              max={s.calorieTarget}
              unit={` ${tCommon("kcal")}`}
            />
            <ProgressBar
              label={t("proteinToday")}
              value={s.todayProtein}
              max={s.proteinTarget}
              unit={tCommon("g")}
            />
          </>
        ) : (
          <p className="text-gray-500 text-sm">{t("loadingStats")}</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <StatChip
            label={t("fasting")}
            value={
              s?.fastingHours != null
                ? t("fastingLogged", { hours: s.fastingHours })
                : tCommon("notLoggedStat")
            }
          />
          <StatChip
            label={t("weight")}
            value={
              s?.weightToday != null
                ? `${s.weightToday} ${tCommon("kg")}`
                : tCommon("notLoggedStat")
            }
          />
        </div>
      </div>

      {s && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {t("todayActivity")}
          </p>
          {s.todaySports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {s.todaySports.map((sport, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background px-3 py-1.5 text-sm text-gray-200"
                >
                  <span aria-hidden>🏃</span>
                  {sport.activity} · {sport.duration_minutes} {tCommon("min")}
                </span>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSportOpen(true)}
              className="text-sm text-gray-500 hover:text-accent transition-colors"
            >
              {t("logActivity")}
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          {t("quickActions")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickBtn href="/journal">{t("logFood")}</QuickBtn>
          <QuickBtn onClick={() => setWeightOpen(true)}>{t("logWeight")}</QuickBtn>
          <QuickBtn onClick={() => setSportOpen(true)}>{t("logSport")}</QuickBtn>
          <QuickBtn onClick={() => setFastingOpen(true)}>{t("logFasting")}</QuickBtn>
          <button
            type="button"
            onClick={togglePeriod}
            disabled={periodLoading}
            className={`rounded-lg border px-3 py-2.5 text-sm transition-colors col-span-2 sm:col-span-1 ${
              s?.periodActive
                ? "border-pink-500/40 bg-pink-500/15 text-pink-200"
                : "border-white/10 text-gray-300 hover:border-white/20"
            }`}
          >
            {s?.periodActive ? t("onPeriodActive") : t("onPeriod")}
          </button>
        </div>
      </div>

      {s && (
        <div className="mt-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {t("thisWeek")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <WeekCard
              label={t("avgCalories")}
              value={`${s.weekAvgCalories} ${tCommon("kcal")}`}
            />
            <WeekCard
              label={t("avgProtein")}
              value={`${s.weekAvgProtein}${tCommon("g")}`}
            />
            <WeekCard
              label={t("weightTrend")}
              value={
                s.weekWeightChange != null
                  ? `${s.weekWeightChange > 0 ? "+" : ""}${s.weekWeightChange}${tCommon("kg")}`
                  : "—"
              }
            />
            <WeekCard
              label={t("daysJournaled")}
              value={`${s.daysJournaledThisWeek} / 7`}
            />
          </div>
        </div>
      )}

      <WeightModal
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        date={date}
        onSuccess={(msg, warn) => {
          setToast(msg);
          setWarning(warn ?? null);
          load();
        }}
      />
      <SportModal
        open={sportOpen}
        onClose={() => setSportOpen(false)}
        date={date}
        onSuccess={() => {
          setToast(t("sportLogged"));
          load();
        }}
      />
      <FastingModal
        open={fastingOpen}
        onClose={() => setFastingOpen(false)}
        date={date}
        onSuccess={() => {
          setToast(t("fastingLoggedToast"));
          load();
        }}
      />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-3 py-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-white mt-0.5">{value}</p>
    </div>
  );
}

function QuickBtn({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "rounded-lg border border-white/10 px-3 py-2.5 text-sm text-gray-200 hover:border-accent/40 hover:bg-accent/5 transition-colors text-left";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function WeekCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
    </div>
  );
}
