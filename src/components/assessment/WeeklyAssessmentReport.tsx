"use client";

import { useTranslations } from "next-intl";
import type { WeeklyAssessmentData } from "@/types/assessment";
import { assessmentPatterns } from "@/types/assessment";
import { formatShortDate } from "@/lib/program/dates";

const PATTERN_KEYS: Record<string, string> = {
  trigger_food: "triggerFood",
  fasting_correlation: "fastingCorrelation",
  period_weight: "periodWeight",
  sport_overeating: "sportOvereating",
  consistency: "consistency",
  calorie_floor: "calorieFloor",
  weight_alert: "weightAlert",
  plateau: "plateau",
};

export function WeeklyAssessmentReport({
  assessment,
  periodStart,
  periodEnd,
}: {
  assessment: WeeklyAssessmentData;
  periodStart: string;
  periodEnd: string;
}) {
  const t = useTranslations("assessment");
  const tPremium = useTranslations("premium");
  const tCommon = useTranslations("common");
  const a = assessment;
  const weightSign = a.weight_change_kg > 0 ? "+" : "";
  const patterns = assessmentPatterns(a);

  return (
    <article className="space-y-6">
      <header className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-card p-6 sm:p-8">
        <p className="text-xs font-medium text-accent uppercase tracking-widest">
          {tPremium("coachLetter")}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
          {t("weekAssessmentTitle", { week: a.week_number })}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {formatShortDate(periodStart)} – {formatShortDate(periodEnd)}
        </p>
        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            a.on_track
              ? "bg-accent/20 text-accent"
              : "bg-amber-500/20 text-amber-200"
          }`}
        >
          {a.on_track ? t("onTrackPace") : t("needsAttention")}
        </div>
      </header>

      <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          {tPremium("weekAtGlance")}
        </h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat
            label={t("weightChange")}
            value={`${weightSign}${a.weight_change_kg} ${tCommon("kg")}`}
          />
          <Stat
            label={t("avgCalories")}
            value={`${a.avg_daily_calories} ${tCommon("kcal")}`}
          />
          <Stat
            label={t("avgProtein")}
            value={`${a.avg_daily_protein}${tCommon("g")}`}
          />
          <Stat
            label={t("fastingAvg")}
            value={t("fastingAvgValue", { hours: a.avg_fasting_hours })}
          />
          <Stat
            label={t("workouts")}
            value={t("workoutSessions", { count: a.sport_sessions })}
          />
          <Stat
            label={t("journaled")}
            value={t("journaledDays", { days: a.days_journaled })}
          />
        </div>
      </section>

      {a.insufficient_data_note && (
        <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            {a.insufficient_data_note}
          </p>
        </section>
      )}

      {patterns.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <span aria-hidden>🧠</span> {tPremium("patternsNoticed")}
          </h2>
          <ul className="mt-4 space-y-4">
            {patterns.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/10 bg-background p-4"
              >
                <p className="text-xs font-medium text-accent uppercase tracking-wide">
                  {PATTERN_KEYS[p.type] ? t(PATTERN_KEYS[p.type]) : p.type}
                </p>
                <p className="mt-2 text-sm text-gray-200 leading-relaxed">
                  {p.insight}
                </p>
                {p.advice && (
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-2">
                    <span className="text-gray-500">→ </span>
                    {p.advice}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.highlights.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <span aria-hidden>✅</span> {tPremium("whatWentWell")}
          </h2>
          <ul className="mt-3 space-y-2">
            {a.highlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-300 leading-relaxed pl-1">
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(a.program_rule_updates?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-accent/20 bg-accent/5 p-5 sm:p-6">
          <h2 className="text-sm font-medium text-accent uppercase tracking-wide">
            {tPremium("newProgramRules")}
          </h2>
          <ul className="mt-3 space-y-2">
            {a.program_rule_updates.map((rule, i) => (
              <li key={i} className="text-sm text-gray-200 flex gap-2">
                <span className="text-accent shrink-0">•</span>
                {rule}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">{tPremium("rulesSavedNote")}</p>
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          {tPremium("nextWeekPlan")}
        </h2>
        <p className="mt-3 text-sm text-gray-300 leading-relaxed">
          {a.next_week_meal_plan_changes}
        </p>
      </section>

      <footer className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
        <h2 className="text-sm font-medium text-accent uppercase tracking-wide">
          {tPremium("coachNote")}
        </h2>
        <p className="mt-3 text-base text-white leading-relaxed italic">
          &ldquo;{a.motivational_message}&rdquo;
        </p>
        <p className="mt-4 text-sm text-gray-500">{tPremium("coachSignoff")}</p>
      </footer>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-white mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
