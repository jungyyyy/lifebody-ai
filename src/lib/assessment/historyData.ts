import type { SupabaseClient } from "@supabase/supabase-js";
import type { FoodLogItem } from "@/types/journal";
import type { WeeklyAssessmentData } from "@/types/assessment";
import { assessmentPatterns } from "@/types/assessment";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";
import { summarizeWeekData, type WeekDataPayload } from "@/lib/assessment/weekData";
import { addDays } from "@/lib/dates";

export interface FoodLogRow {
  log_date: string;
  meal_type: string;
  items: FoodLogItem[];
  total_calories: number;
  total_protein: number;
  logged_at: string;
}

export interface PriorAssessmentSummary {
  week_number: number;
  period_start: string;
  period_end: string;
  patterns: { type: string; insight: string }[];
  program_rule_updates: string[];
  motivational_message: string;
}

export interface AssessmentHistoryPayload {
  nickname: string;
  programStartedAt: string | null;
  periodStart: string;
  periodEnd: string;
  programWeek: number;
  calorieTarget: number;
  proteinTarget: number;
  currentWeek: WeekDataPayload;
  currentWeekStats: ReturnType<typeof summarizeWeekData>;
  allFoodLogs: FoodLogRow[];
  allWeights: { date: string; weight_kg: number }[];
  allSports: { date: string; activity: string; duration_minutes: number }[];
  allFasting: { date: string; hours: number }[];
  allPeriodDays: string[];
  priorAssessments: PriorAssessmentSummary[];
  weeksWithFoodLogs: number;
  totalFoodLogRows: number;
  dataHints: DataHints;
}

export interface DataHints {
  calorieFloorDays: { date: string; calories: number }[];
  journalingByWeek: { weekLabel: string; days: number }[];
  rapidLossWeeks: { weekLabel: string; changeKg: number }[];
  plateauWeeks: number;
}

function parseItems(raw: unknown): FoodLogItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      food: String(o.food ?? ""),
      amount: String(o.amount ?? ""),
      calories: Number(o.calories ?? 0),
      protein: Number(o.protein ?? 0),
    };
  });
}

function weekKey(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const start = new Date(d);
  start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}

export function computeDataHints(payload: {
  allFoodLogs: FoodLogRow[];
  allWeights: { date: string; weight_kg: number }[];
  programStartedAt: string | null;
}): DataHints {
  const dailyCalories = new Map<string, number>();
  for (const row of payload.allFoodLogs) {
    dailyCalories.set(
      row.log_date,
      (dailyCalories.get(row.log_date) ?? 0) + row.total_calories
    );
  }

  const calorieFloorDays = Array.from(dailyCalories.entries())
    .filter(([, cal]) => cal > 0 && cal < 1450)
    .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysByWeek = new Map<string, Set<string>>();
  dailyCalories.forEach((_, date) => {
    const wk = weekKey(date);
    if (!daysByWeek.has(wk)) daysByWeek.set(wk, new Set());
    daysByWeek.get(wk)!.add(date);
  });
  const journalingByWeek = Array.from(daysByWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([wk, days]) => ({
      weekLabel: wk,
      days: days.size,
    }));

  const weightsByWeek = new Map<string, { first: number; last: number }>();
  for (const w of payload.allWeights) {
    const wk = weekKey(w.date);
    const entry = weightsByWeek.get(wk);
    if (!entry) {
      weightsByWeek.set(wk, { first: w.weight_kg, last: w.weight_kg });
    } else {
      entry.last = w.weight_kg;
    }
  }
  const rapidLossWeeks = Array.from(weightsByWeek.entries())
    .map(([weekLabel, { first, last }]) => ({
      weekLabel,
      changeKg: Math.round((last - first) * 10) / 10,
    }))
    .filter((w) => w.changeKg < -1);

  let plateauWeeks = 0;
  const sortedWeeks = Array.from(weightsByWeek.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (let i = 1; i < sortedWeeks.length; i++) {
    const prev = sortedWeeks[i - 1][1];
    const curr = sortedWeeks[i][1];
    const change = curr.last - prev.last;
    if (Math.abs(change) < 0.2) plateauWeeks++;
  }

  return {
    calorieFloorDays,
    journalingByWeek,
    rapidLossWeeks,
    plateauWeeks,
  };
}

export async function fetchAssessmentHistory(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<AssessmentHistoryPayload> {
  const [
    foodRes,
    weightRes,
    sportRes,
    fastRes,
    periodRes,
    programRes,
    profileRes,
    priorRes,
    programWeeks,
  ] = await Promise.all([
    supabase
      .from("food_logs")
      .select(
        "log_date, meal_type, items, total_calories, total_protein, created_at"
      )
      .eq("user_id", userId)
      .order("log_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("log_date, weight_kg")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("sport_logs")
      .select("log_date, activity, duration_minutes")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("fasting_logs")
      .select("log_date, hours")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("period_logs")
      .select("log_date")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", userId)
      .eq("block_number", 1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("program_started_at, nickname")
      .eq("id", userId)
      .single(),
    supabase
      .from("weekly_assessments")
      .select("week_number, period_start, period_end, assessment")
      .eq("user_id", userId)
      .order("week_number", { ascending: true }),
    getProgramLengthWeeks(supabase, userId),
  ]);

  const allFoodLogs: FoodLogRow[] = (foodRes.data ?? []).map((row) => ({
    log_date: row.log_date as string,
    meal_type: row.meal_type as string,
    items: parseItems(row.items),
    total_calories: Number(row.total_calories),
    total_protein: Number(row.total_protein),
    logged_at: row.created_at as string,
  }));

  const allWeights = (weightRes.data ?? []).map((w) => ({
    date: w.log_date as string,
    weight_kg: Number(w.weight_kg),
  }));

  const allSports = (sportRes.data ?? []).map((s) => ({
    date: s.log_date as string,
    activity: s.activity as string,
    duration_minutes: s.duration_minutes as number,
  }));

  const allFasting = (fastRes.data ?? []).map((f) => ({
    date: f.log_date as string,
    hours: Number(f.hours),
  }));

  const allPeriodDays = (periodRes.data ?? []).map((p) => p.log_date as string);

  const program = programRes.data?.program as {
    calorie_target?: number;
    protein_target_g?: number;
  } | null;

  const programStartedAt = profileRes.data?.program_started_at ?? null;
  const programWeek = programStartedAt
    ? programWeekNumber(programStartedAt, programWeeks)
    : 1;

  const foodByDate: WeekDataPayload["foodByDate"] = {};
  for (const row of allFoodLogs.filter(
    (r) => r.log_date >= periodStart && r.log_date <= periodEnd
  )) {
    if (!foodByDate[row.log_date]) {
      foodByDate[row.log_date] = { calories: 0, protein: 0, meals: [] };
    }
    foodByDate[row.log_date].calories += row.total_calories;
    foodByDate[row.log_date].protein += row.total_protein;
    const itemDetail = row.items
      .map((i) => `${i.food}${i.amount ? ` (${i.amount})` : ""} [${i.calories}kcal]`)
      .join(", ");
    foodByDate[row.log_date].meals.push(
      `${row.meal_type} @ ${row.logged_at.slice(11, 16)}: ${itemDetail || "—"}`
    );
  }

  const currentWeek: WeekDataPayload = {
    periodStart,
    periodEnd,
    foodByDate,
    weights: allWeights.filter(
      (w) => w.date >= periodStart && w.date <= periodEnd
    ),
    sports: allSports.filter(
      (s) => s.date >= periodStart && s.date <= periodEnd
    ),
    fasting: allFasting.filter(
      (f) => f.date >= periodStart && f.date <= periodEnd
    ),
    periodDays: allPeriodDays.filter(
      (d) => d >= periodStart && d <= periodEnd
    ),
    calorieTarget: program?.calorie_target ?? 1700,
    proteinTarget: program?.protein_target_g ?? 120,
    programWeek,
  };

  const weeksWithFood = new Set(allFoodLogs.map((r) => weekKey(r.log_date)));

  const priorAssessments: PriorAssessmentSummary[] = (priorRes.data ?? []).map(
    (row) => {
      const a = row.assessment as WeeklyAssessmentData;
      return {
        week_number: row.week_number as number,
        period_start: row.period_start as string,
        period_end: row.period_end as string,
        patterns: assessmentPatterns(a).map((p) => ({
          type: p.type,
          insight: p.insight,
        })),
        program_rule_updates: a.program_rule_updates ?? [],
        motivational_message: a.motivational_message,
      };
    }
  );

  const dataHints = computeDataHints({
    allFoodLogs,
    allWeights,
    programStartedAt,
  });

  return {
    nickname: profileRes.data?.nickname?.trim() || "friend",
    programStartedAt,
    periodStart,
    periodEnd,
    programWeek,
    calorieTarget: program?.calorie_target ?? 1700,
    proteinTarget: program?.protein_target_g ?? 120,
    currentWeek,
    currentWeekStats: summarizeWeekData(currentWeek),
    allFoodLogs,
    allWeights,
    allSports,
    allFasting,
    allPeriodDays,
    priorAssessments,
    weeksWithFoodLogs: weeksWithFood.size,
    totalFoodLogRows: allFoodLogs.length,
    dataHints,
  };
}

/** Group period days into consecutive ranges for the prompt. */
export function formatPeriodRanges(days: string[]): string {
  if (days.length === 0) return "none logged";
  const sorted = [...days].sort();
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const expected = addDays(end, 1);
    if (next === expected) {
      end = next;
    } else {
      ranges.push(start === end ? start : `${start} to ${end}`);
      start = next;
      end = next;
    }
  }
  ranges.push(start === end ? start : `${start} to ${end}`);
  return ranges.join("; ");
}
