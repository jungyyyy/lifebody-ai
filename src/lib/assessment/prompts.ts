import type {
  AssessmentHistoryPayload,
  FoodLogRow,
} from "@/lib/assessment/historyData";
import { formatPeriodRanges } from "@/lib/assessment/historyData";

function formatCurrentWeekFood(history: AssessmentHistoryPayload): string {
  const lines: string[] = [];
  for (const [date, day] of Object.entries(history.currentWeek.foodByDate).sort(
    ([a], [b]) => a.localeCompare(b)
  )) {
    lines.push(
      `${date}: ${Math.round(day.calories)} kcal, ${Math.round(day.protein * 10) / 10}g protein`
    );
    for (const meal of day.meals) {
      lines.push(`  - ${meal}`);
    }
  }
  return lines.length ? lines.join("\n") : "No food logged this week";
}

function formatHistoricalFoodSummary(history: AssessmentHistoryPayload): string {
  const { periodStart, periodEnd, allFoodLogs } = history;
  const prior = allFoodLogs.filter(
    (r) => r.log_date < periodStart || r.log_date > periodEnd
  );
  if (prior.length === 0) return "No prior weeks of food logs.";

  const byWeek = new Map<string, FoodLogRow[]>();
  for (const row of prior) {
    const wk = row.log_date.slice(0, 7);
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(row);
  }

  const lines: string[] = [];
  for (const [month, rows] of Array.from(byWeek.entries()).sort()) {
    const itemCounts = new Map<string, number>();
    let totalCal = 0;
    const days = new Set<string>();
    for (const r of rows) {
      days.add(r.log_date);
      totalCal += r.total_calories;
      for (const item of r.items) {
        const key = item.food.toLowerCase().trim();
        if (!key) continue;
        itemCounts.set(key, (itemCounts.get(key) ?? 0) + 1);
      }
    }
    const topItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([food, n]) => `${food} (${n}x)`)
      .join(", ");
    lines.push(
      `Month ${month}: ${days.size} days journaled, ~${Math.round(totalCal / Math.max(1, days.size))} kcal/day avg. Frequent items: ${topItems || "—"}`
    );
    for (const r of rows.slice(-12)) {
      const items = r.items
        .map((i) => `${i.food}${i.amount ? ` ${i.amount}` : ""}`)
        .join(", ");
      lines.push(
        `  ${r.log_date} ${r.meal_type}: ${items} (${Math.round(r.total_calories)} kcal)`
      );
    }
  }
  return lines.join("\n");
}

export function buildWeeklyAssessmentPrompt(
  history: AssessmentHistoryPayload
): string {
  const s = history.currentWeekStats;
  const h = history.dataHints;

  const priorMemory =
    history.priorAssessments.length > 0
      ? history.priorAssessments
          .map(
            (p) =>
              `Week ${p.week_number} (${p.period_start}–${p.period_end}):\n` +
              `  Patterns: ${p.patterns.map((x) => `[${x.type}] ${x.insight}`).join("; ") || "none"}\n` +
              `  Rules added: ${p.program_rule_updates.join("; ") || "none"}\n` +
              `  Note: ${p.motivational_message.slice(0, 200)}`
          )
          .join("\n\n")
      : "No prior weekly assessments.";

  const weightSeries = history.allWeights
    .map((w) => `${w.date}: ${w.weight_kg}kg`)
    .join("\n");

  const fastingSeries = history.allFasting
    .map((f) => `${f.date}: ${f.hours}h`)
    .join("\n");

  const sportSeries = history.allSports
    .map((s) => `${s.date}: ${s.activity} (${s.duration_minutes} min)`)
    .join("\n");

  const enoughHistory = history.weeksWithFoodLogs >= 2;

  return `You are LifeBody AI's weekly coach. Analyze ALL logged data, detect REAL behavioral patterns with evidence, and give concrete actionable advice for ${history.nickname}.

CRITICAL RULES:
- Only include a pattern in patterns_detected if you have clear evidence from the logs below.
- Never invent foods, dates, or correlations not supported by data.
- If insufficient history (fewer than 2 weeks of food logs: ${history.weeksWithFoodLogs} weeks), set insufficient_data_note warmly: "I need a couple more weeks of data to spot your patterns. Keep logging — I'm watching and learning." and patterns_detected may be empty or only patterns from THIS week with strong evidence.
- Use gemini-quality reasoning: cross-reference dates across food, weight, fasting, sport, period logs.

PROGRAM TARGETS: ${history.calorieTarget} kcal/day, ${history.proteinTarget}g protein/day. Never recommend eating below 1450 kcal/day.
PROGRAM WEEK: ${history.programWeek}
CURRENT WEEK PERIOD: ${history.periodStart} to ${history.periodEnd}
PROGRAM STARTED: ${history.programStartedAt ?? "unknown"}
WEEKS WITH FOOD LOGS: ${history.weeksWithFoodLogs} | TOTAL MEAL LOGS: ${history.totalFoodLogRows}

CURRENT WEEK STATS (use these exact numbers in output):
- weight_change_kg: ${s.weightChangeKg ?? "unknown"}
- avg_daily_calories: ${s.avgDailyCalories}
- avg_daily_protein: ${s.avgDailyProtein}
- days_journaled: ${s.daysJournaled}/7
- sport_sessions: ${s.sportsSessions}
- avg_fasting_hours: ${s.avgFastingHours}

PRE-COMPUTED HINTS (verify against raw data before using):
- Days under 1450 kcal: ${h.calorieFloorDays.map((d) => `${d.date} (${d.calories} kcal)`).join(", ") || "none"}
- Journaling by week: ${h.journalingByWeek.map((w) => `${w.weekLabel}: ${w.days}/7 days`).join("; ") || "n/a"}
- Weeks with >1kg loss: ${h.rapidLossWeeks.map((w) => `${w.weekLabel}: ${w.changeKg}kg`).join("; ") || "none"}
- Possible plateau streak: ${h.plateauWeeks} week(s) with minimal change

PATTERN TYPES TO ANALYZE (only if evidence exists):

1. TRIGGER FOOD — same item 2+ times across weeks in unusually large amounts
2. FASTING & WEIGHT — longer fasts (16+h) correlate with more weight loss vs shorter fasts at similar calories
3. PERIOD & WEIGHT — less loss or gain during period weeks vs non-period weeks with similar diet
4. SPORT & OVEREATING — workout days consistently higher calories than rest days beyond normal post-workout meal
5. CONSISTENCY — journaling frequency drops; compare weeks with full vs partial journaling
6. CALORIE FLOOR — any day below 1450 kcal logged
7. WEIGHT ALERT — loss >1kg in 7 days OR no change/gain 2+ weeks despite consistent logging (plateau)
8. PLATEAU — use type "plateau" for sustained stall; "weight_alert" for rapid loss warning

PRIOR ASSESSMENT MEMORY (build on these insights, don't repeat verbatim):
${priorMemory}

=== CURRENT WEEK FOOD (full detail) ===
${formatCurrentWeekFood(history)}

=== PRIOR WEEKS FOOD (summary + sample meals) ===
${formatHistoricalFoodSummary(history)}

=== ALL WEIGHT LOGS ===
${weightSeries || "none"}

=== ALL FASTING LOGS ===
${fastingSeries || "none"}

=== ALL SPORT LOGS ===
${sportSeries || "none"}

=== PERIOD LOGS (date ranges) ===
${formatPeriodRanges(history.allPeriodDays)}

After pattern analysis, decide PROGRAM ADAPTATIONS:
- Trigger food → add rule "avoid keeping [food] at home" in program_rule_updates
- Strong fasting correlation → update fasting in program_updates
- Meal plan foods user never eats / patterns suggest swaps → describe in next_week_meal_plan_changes and set program_updates.meal_plan_adjustment_request

Return ONLY valid JSON:
{
  "week_number": ${history.programWeek},
  "weight_change_kg": number,
  "avg_daily_calories": ${s.avgDailyCalories},
  "avg_daily_protein": ${s.avgDailyProtein},
  "avg_fasting_hours": ${s.avgFastingHours},
  "days_journaled": ${s.daysJournaled},
  "sport_sessions": ${s.sportsSessions},
  "on_track": boolean,
  "patterns_detected": [
    {
      "type": "trigger_food"|"fasting_correlation"|"period_weight"|"sport_overeating"|"consistency"|"calorie_floor"|"weight_alert"|"plateau",
      "insight": "specific observation citing dates/numbers from logs",
      "advice": "concrete actionable suggestion in warm coach tone"
    }
  ],
  "highlights": string[] (2-4 positives from this week),
  "next_week_meal_plan_changes": string (what to change and why, or "No meal plan changes needed"),
  "program_rule_updates": string[] (new rules to add, e.g. "Avoid keeping ice cream at home"),
  "motivational_message": string (personal, warm, specific),
  "insufficient_data_note": string or null,
  "program_updates": {
    "rule_notes": string[] (duplicate of new rules to persist on program),
    "fasting_window": string or null (only if recommending change),
    "fasting_is_intermittent": boolean or null,
    "meal_plan_adjustment_request": string or null (specific instruction for meal planner, e.g. "Replace repetitive chicken bowls with fish twice this week")
  }
}

${!enoughHistory ? "NOTE: User has <2 weeks of food data — prioritize insufficient_data_note unless a pattern is undeniable from current week." : ""}`;
}
