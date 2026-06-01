"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/app/ProgressBar";
import type { DashboardSummary } from "@/lib/dashboard/queries";
import { formatDisplayDate, localDateString } from "@/lib/dates";
import {
  FastingModal,
  SportModal,
  WeightModal,
} from "./LogModals";

export function DashboardHome({ initialNickname }: { initialNickname: string }) {
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
          Welcome back, {nickname}
        </h1>
        {s && (
          <p className="mt-1 text-sm text-gray-400">
            {formatDisplayDate(s.displayDate)} · Day {s.programDay} of{" "}
            {s.programTotalDays}
          </p>
        )}
      </div>

      {s?.periodActive && (
        <p className="mt-4 rounded-lg border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">
          You may see weight fluctuation this week — that&apos;s completely normal 🌸
        </p>
      )}

      <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
        {s ? (
          <>
            <ProgressBar
              label="Calories today"
              value={s.todayCalories}
              max={s.calorieTarget}
              unit=" kcal"
            />
            <ProgressBar
              label="Protein today"
              value={s.todayProtein}
              max={s.proteinTarget}
              unit="g"
            />
          </>
        ) : (
          <p className="text-gray-500 text-sm">Loading today&apos;s stats…</p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <StatChip
            label="Fasting"
            value={
              s?.fastingHours != null ? `${s.fastingHours}h logged` : "Not logged"
            }
          />
          <StatChip
            label="Weight"
            value={
              s?.weightToday != null ? `${s.weightToday} kg` : "Not logged"
            }
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickBtn href="/journal">+ Log food</QuickBtn>
          <QuickBtn onClick={() => setWeightOpen(true)}>+ Log weight</QuickBtn>
          <QuickBtn onClick={() => setSportOpen(true)}>+ Log sport</QuickBtn>
          <QuickBtn onClick={() => setFastingOpen(true)}>+ Log fasting</QuickBtn>
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
            {s?.periodActive ? "🌸 On my period" : "On my period"}
          </button>
        </div>
      </div>

      {s && (
        <div className="mt-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            This week
          </p>
          <div className="grid grid-cols-2 gap-3">
            <WeekCard label="Avg calories" value={`${s.weekAvgCalories} kcal`} />
            <WeekCard label="Avg protein" value={`${s.weekAvgProtein}g`} />
            <WeekCard
              label="Weight trend"
              value={
                s.weekWeightChange != null
                  ? `${s.weekWeightChange > 0 ? "+" : ""}${s.weekWeightChange}kg`
                  : "—"
              }
            />
            <WeekCard
              label="Days journaled"
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
          setToast("Sport logged ✓");
          load();
        }}
      />
      <FastingModal
        open={fastingOpen}
        onClose={() => setFastingOpen(false)}
        date={date}
        onSuccess={() => {
          setToast("Fasting logged ✓");
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
