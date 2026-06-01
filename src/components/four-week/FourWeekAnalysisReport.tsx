"use client";

import { WeightChart } from "@/components/progress/WeightChart";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";
import { formatShortDate } from "@/lib/program/dates";

const TREND_ICONS: Record<string, string> = {
  improving: "↑",
  stable: "→",
  declining: "↓",
};

const PACE_LABELS: Record<string, string> = {
  ahead: "Ahead of plan",
  on_track: "On track",
  behind: "Behind plan",
};

export function FourWeekAnalysisReport({
  analysis,
  weekRange,
  periodStart,
  periodEnd,
  weights,
}: {
  analysis: FourWeekAnalysisData;
  weekRange: string;
  periodStart: string;
  periodEnd: string;
  weights: { date: string; weight: number }[];
}) {
  const a = analysis;
  const startWeight = weights.length > 0 ? weights[0].weight : 0;
  const endWeight =
    weights.length > 0 ? weights[weights.length - 1].weight : startWeight;
  const endChanged = a.program_recalibration.original_end_date !==
    a.program_recalibration.updated_end_date;

  return (
    <article className="space-y-6">
      <header className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 via-card to-card p-6 sm:p-8">
        <p className="text-xs font-medium text-violet-300 uppercase tracking-widest">
          4-week deep analysis
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
          {weekRange}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {formatShortDate(periodStart)} – {formatShortDate(periodEnd)}
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Progress overview
        </h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Actual loss"
            value={`${a.total_weight_change_kg > 0 ? "−" : "+"}${Math.abs(a.total_weight_change_kg)} kg`}
            accent
          />
          <Stat
            label="Expected"
            value={`${a.expected_weight_change_kg} kg`}
          />
          <Stat label="Pace" value={PACE_LABELS[a.pace] ?? a.pace} />
          <Stat
            label="Gap"
            value={`${a.pace_gap_kg > 0 ? "+" : ""}${a.pace_gap_kg} kg`}
          />
        </div>
        <div
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            a.on_track
              ? "bg-accent/20 text-accent"
              : "bg-amber-500/20 text-amber-200"
          }`}
        >
          {a.on_track ? "On track overall" : "Needs adjustment"}
        </div>
      </section>

      <WeightChart
        points={weights}
        startWeight={startWeight}
        currentWeight={endWeight}
        totalChange={a.total_weight_change_kg}
        weekTrend={null}
        periodEnd={periodEnd}
        dayCount={28}
        title="4-week weight curve"
        showSummary={false}
      />

      {a.long_term_patterns.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <span aria-hidden>🔍</span> Long-term patterns
          </h2>
          <ul className="mt-4 space-y-4">
            {a.long_term_patterns.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/10 bg-background p-4"
              >
                <p className="text-sm text-white font-medium">{p.pattern}</p>
                <p className="mt-2 text-xs text-gray-500">{p.evidence}</p>
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                  {p.advice}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
          Trends
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <TrendChip label="Diet quality" value={a.diet_quality_trend} />
          <TrendChip label="Fitness" value={a.fitness_trend} />
          <TrendChip label="Protein" value={a.protein_trend} />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-white">
          Next 4 weeks — your focus
        </h2>
        <ol className="mt-3 space-y-2 list-decimal list-inside">
          {a.next_4_weeks_focus.map((f, i) => (
            <li key={i} className="text-sm text-gray-300 leading-relaxed">
              {f}
            </li>
          ))}
        </ol>
      </section>

      {endChanged && (
        <section className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 sm:p-6">
          <h2 className="text-sm font-medium text-sky-200">
            Program end date updated
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            <span className="line-through text-gray-500">
              {formatShortDate(a.program_recalibration.original_end_date)}
            </span>
            {" → "}
            <span className="text-sky-200 font-medium">
              {formatShortDate(a.program_recalibration.updated_end_date)}
            </span>
          </p>
          <p className="mt-2 text-sm text-gray-400">{a.program_recalibration.reason}</p>
        </section>
      )}

      {a.maintenance_break_recommended && a.maintenance_break_message && (
        <section className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-5 sm:p-6">
          <h2 className="text-lg font-medium text-amber-200">
            Maintenance break recommended
          </h2>
          <p className="mt-3 text-sm text-amber-100/90 leading-relaxed">
            {a.maintenance_break_message}
          </p>
        </section>
      )}

      <footer className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 sm:p-8 shadow-inner">
        <p className="text-xs text-violet-300/80 uppercase tracking-widest font-serif">
          Coach&apos;s letter
        </p>
        <p className="mt-4 text-base sm:text-lg text-white leading-relaxed font-serif italic">
          {a.coach_letter}
        </p>
        <p className="mt-6 text-sm text-gray-500">— LifeBody AI 🌿</p>
      </footer>
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-lg font-semibold mt-0.5 tabular-nums ${
          accent ? "text-accent" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TrendChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const icon = TREND_ICONS[value] ?? "→";
  const color =
    value === "improving"
      ? "text-accent"
      : value === "declining"
        ? "text-amber-300"
        : "text-gray-400";
  return (
    <div className="rounded-lg bg-background border border-white/10 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-medium capitalize ${color}`}>
        {icon} {value}
      </p>
    </div>
  );
}
