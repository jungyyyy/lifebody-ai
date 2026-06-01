import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedProgram } from "@/types/onboarding";
import { addDays, daysBetween, localDateString } from "@/lib/dates";

const PROGRAM_DAYS = 84;

export interface DashboardSummary {
  nickname: string;
  displayDate: string;
  programDay: number;
  programTotalDays: number;
  calorieTarget: number;
  proteinTarget: number;
  todayCalories: number;
  todayProtein: number;
  fastingHours: number | null;
  weightToday: number | null;
  periodActive: boolean;
  weekAvgCalories: number;
  weekAvgProtein: number;
  weekWeightChange: number | null;
  daysJournaledThisWeek: number;
}

export async function getDashboardSummary(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DashboardSummary> {
  const weekStart = addDays(date, -6);

  const [
    profileRes,
    programRes,
    foodTodayRes,
    foodWeekRes,
    weightTodayRes,
    weightWeekRes,
    fastingTodayRes,
    periodTodayRes,
    journalDaysRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname, program_started_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", userId)
      .eq("block_number", 1)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select("total_calories, total_protein")
      .eq("user_id", userId)
      .eq("log_date", date),
    supabase
      .from("food_logs")
      .select("log_date, total_calories, total_protein")
      .eq("user_id", userId)
      .gte("log_date", weekStart)
      .lte("log_date", date),
    supabase
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle(),
    supabase
      .from("weight_logs")
      .select("log_date, weight_kg")
      .eq("user_id", userId)
      .gte("log_date", weekStart)
      .lte("log_date", date)
      .order("log_date", { ascending: true }),
    supabase
      .from("fasting_logs")
      .select("hours")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle(),
    supabase
      .from("period_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select("log_date")
      .eq("user_id", userId)
      .gte("log_date", weekStart)
      .lte("log_date", date),
  ]);

  const program = programRes.data?.program as GeneratedProgram | undefined;
  const calorieTarget = program?.calorie_target ?? 1700;
  const proteinTarget = program?.protein_target_g ?? 120;

  const todayFood = foodTodayRes.data ?? [];
  const todayCalories = todayFood.reduce(
    (s, r) => s + Number(r.total_calories),
    0
  );
  const todayProtein = todayFood.reduce(
    (s, r) => s + Number(r.total_protein),
    0
  );

  const weekFood = foodWeekRes.data ?? [];
  const daysWithFood = new Set(weekFood.map((r) => r.log_date)).size;
  const weekAvgCalories =
    daysWithFood > 0
      ? weekFood.reduce((s, r) => s + Number(r.total_calories), 0) /
        daysWithFood
      : 0;
  const weekAvgProtein =
    daysWithFood > 0
      ? weekFood.reduce((s, r) => s + Number(r.total_protein), 0) / daysWithFood
      : 0;

  const weights = weightWeekRes.data ?? [];
  let weekWeightChange: number | null = null;
  if (weights.length >= 2) {
    weekWeightChange =
      Number(weights[weights.length - 1].weight_kg) -
      Number(weights[0].weight_kg);
  }

  const programStarted = profileRes.data?.program_started_at;
  const programDay = programStarted
    ? Math.min(PROGRAM_DAYS, daysBetween(programStarted))
    : 1;

  return {
    nickname: profileRes.data?.nickname?.trim() || "there",
    displayDate: date,
    programDay,
    programTotalDays: PROGRAM_DAYS,
    calorieTarget,
    proteinTarget,
    todayCalories: Math.round(todayCalories),
    todayProtein: Math.round(todayProtein * 10) / 10,
    fastingHours: fastingTodayRes.data
      ? Number(fastingTodayRes.data.hours)
      : null,
    weightToday: weightTodayRes.data
      ? Number(weightTodayRes.data.weight_kg)
      : null,
    periodActive: !!periodTodayRes.data,
    weekAvgCalories: Math.round(weekAvgCalories),
    weekAvgProtein: Math.round(weekAvgProtein),
    weekWeightChange:
      weekWeightChange !== null
        ? Math.round(weekWeightChange * 10) / 10
        : null,
    daysJournaledThisWeek: new Set(
      (journalDaysRes.data ?? []).map((r) => r.log_date)
    ).size,
  };
}

export function defaultSummary(date: string): DashboardSummary {
  return {
    nickname: "there",
    displayDate: date,
    programDay: 1,
    programTotalDays: PROGRAM_DAYS,
    calorieTarget: 1700,
    proteinTarget: 120,
    todayCalories: 0,
    todayProtein: 0,
    fastingHours: null,
    weightToday: null,
    periodActive: false,
    weekAvgCalories: 0,
    weekAvgProtein: 0,
    weekWeightChange: null,
    daysJournaledThisWeek: 0,
  };
}
