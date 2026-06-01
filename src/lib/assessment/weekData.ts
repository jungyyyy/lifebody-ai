import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, localDateString } from "@/lib/dates";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";

export interface WeekDataPayload {
  periodStart: string;
  periodEnd: string;
  foodByDate: Record<
    string,
    { calories: number; protein: number; meals: string[] }
  >;
  weights: { date: string; weight_kg: number }[];
  sports: { date: string; activity: string; duration_minutes: number }[];
  fasting: { date: string; hours: number }[];
  periodDays: string[];
  calorieTarget: number;
  proteinTarget: number;
  programWeek: number;
}

export function lastSevenDaysRange(endDate?: string): {
  periodStart: string;
  periodEnd: string;
} {
  const end = endDate ?? localDateString();
  return {
    periodStart: addDays(end, -6),
    periodEnd: end,
  };
}

export function isSunday(date = new Date()): boolean {
  return date.getDay() === 0;
}

export async function fetchWeekData(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<WeekDataPayload> {
  const [foodRes, weightRes, sportRes, fastRes, periodRes, programRes, profileRes] =
    await Promise.all([
      supabase
        .from("food_logs")
        .select("log_date, meal_type, total_calories, total_protein, items")
        .eq("user_id", userId)
        .gte("log_date", periodStart)
        .lte("log_date", periodEnd),
      supabase
        .from("weight_logs")
        .select("log_date, weight_kg")
        .eq("user_id", userId)
        .gte("log_date", periodStart)
        .lte("log_date", periodEnd)
        .order("log_date", { ascending: true }),
      supabase
        .from("sport_logs")
        .select("log_date, activity, duration_minutes")
        .eq("user_id", userId)
        .gte("log_date", periodStart)
        .lte("log_date", periodEnd),
      supabase
        .from("fasting_logs")
        .select("log_date, hours")
        .eq("user_id", userId)
        .gte("log_date", periodStart)
        .lte("log_date", periodEnd),
      supabase
        .from("period_logs")
        .select("log_date")
        .eq("user_id", userId)
        .gte("log_date", periodStart)
        .lte("log_date", periodEnd),
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
    ]);

  const foodByDate: WeekDataPayload["foodByDate"] = {};
  for (const row of foodRes.data ?? []) {
    const d = row.log_date as string;
    if (!foodByDate[d]) {
      foodByDate[d] = { calories: 0, protein: 0, meals: [] };
    }
    foodByDate[d].calories += Number(row.total_calories);
    foodByDate[d].protein += Number(row.total_protein);
    const items = row.items as { food?: string }[] | null;
    const label = items?.map((i) => i.food).filter(Boolean).join(", ") ?? row.meal_type;
    foodByDate[d].meals.push(`${row.meal_type}: ${label}`);
  }

  const program = programRes.data?.program as {
    calorie_target?: number;
    protein_target_g?: number;
  } | null;

  const programWeeks = await getProgramLengthWeeks(supabase, userId);
  const programWeek = profileRes.data?.program_started_at
    ? programWeekNumber(profileRes.data.program_started_at, programWeeks)
    : 1;

  return {
    periodStart,
    periodEnd,
    foodByDate,
    weights: (weightRes.data ?? []).map((w) => ({
      date: w.log_date as string,
      weight_kg: Number(w.weight_kg),
    })),
    sports: (sportRes.data ?? []).map((s) => ({
      date: s.log_date as string,
      activity: s.activity as string,
      duration_minutes: s.duration_minutes as number,
    })),
    fasting: (fastRes.data ?? []).map((f) => ({
      date: f.log_date as string,
      hours: Number(f.hours),
    })),
    periodDays: (periodRes.data ?? []).map((p) => p.log_date as string),
    calorieTarget: program?.calorie_target ?? 1700,
    proteinTarget: program?.protein_target_g ?? 120,
    programWeek,
  };
}

export function summarizeWeekData(data: WeekDataPayload) {
  const days = Object.keys(data.foodByDate);
  const totalCal = days.reduce((s, d) => s + data.foodByDate[d].calories, 0);
  const totalPro = days.reduce((s, d) => s + data.foodByDate[d].protein, 0);
  const daysWithFood = days.length;

  const weightChange =
    data.weights.length >= 2
      ? data.weights[data.weights.length - 1].weight_kg -
        data.weights[0].weight_kg
      : data.weights.length === 1
        ? 0
        : null;

  const avgFasting =
    data.fasting.length > 0
      ? data.fasting.reduce((s, f) => s + f.hours, 0) / data.fasting.length
      : 0;

  return {
    avgDailyCalories:
      daysWithFood > 0 ? Math.round(totalCal / daysWithFood) : 0,
    avgDailyProtein:
      daysWithFood > 0 ? Math.round((totalPro / daysWithFood) * 10) / 10 : 0,
    daysJournaled: daysWithFood,
    weightChangeKg: weightChange,
    sportsSessions: data.sports.length,
    avgFastingHours: Math.round(avgFasting * 10) / 10,
  };
}
