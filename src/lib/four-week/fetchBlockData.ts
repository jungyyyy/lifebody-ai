import type { SupabaseClient } from "@supabase/supabase-js";
import type { FoodLogItem } from "@/types/journal";
import type { WeeklyAssessmentData } from "@/types/assessment";
import { assessmentPatterns } from "@/types/assessment";
import type { BodyAssessment } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";
import {
  analysisPeriodLabel,
  blockDateRange,
  blockNumberForProgramWeek,
  programEndDateIso,
} from "@/lib/four-week/block";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";
import { formatPeriodRanges } from "@/lib/assessment/historyData";

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

function goalBodyLabel(id: string) {
  return GOAL_BODY_OPTIONS.find((g) => g.id === id)?.title ?? id;
}

export interface FourWeekBlockPayload {
  nickname: string;
  blockNumber: number;
  programWeek: number;
  analysisPeriod: string;
  periodStart: string;
  periodEnd: string;
  programStartedAt: string;
  programStartDate: string;
  programLengthWeeks: number;
  programEndDate: string;
  weeklyLossRateKg: number;
  goalWeightKg: number;
  currentWeightKg: number;
  goalBodyLabel: string;
  goalBodyType: string;
  calorieTarget: number;
  proteinTarget: number;
  program: GeneratedProgram | null;
  foodLogs: {
    log_date: string;
    meal_type: string;
    items: FoodLogItem[];
    total_calories: number;
    total_protein: number;
    logged_at: string;
  }[];
  weights: { date: string; weight_kg: number }[];
  sports: { date: string; activity: string; duration_minutes: number }[];
  fasting: { date: string; hours: number }[];
  periodDays: string[];
  weeklyAssessments: {
    week_number: number;
    period_start: string;
    period_end: string;
    patterns: { type: string; insight: string }[];
    highlights: string[];
    motivational_message: string;
  }[];
}

export async function fetchFourWeekBlockData(
  supabase: SupabaseClient,
  userId: string,
  blockNumber?: number
): Promise<FourWeekBlockPayload> {
  const [profileRes, onboardingRes, programRes, programWeeks] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "nickname, program_started_at, weekly_loss_rate_kg, program_length_weeks"
        )
        .eq("id", userId)
        .single(),
      supabase
        .from("onboarding_data")
        .select(
          "current_weight_kg, goal_body_type, body_assessment"
        )
        .eq("user_id", userId)
        .single(),
      supabase
        .from("user_programs")
        .select("program")
        .eq("user_id", userId)
        .eq("block_number", 1)
        .maybeSingle(),
      getProgramLengthWeeks(supabase, userId),
    ]);

  const programStartedAt = profileRes.data?.program_started_at;
  if (!programStartedAt) {
    throw new Error("Program not started");
  }

  const programStartDate = programStartedAt.split("T")[0];
  const programWeek = programWeekNumber(programStartedAt, programWeeks);
  const block =
    blockNumber ?? blockNumberForProgramWeek(programWeek);
  const { periodStart, periodEnd } = blockDateRange(programStartDate, block);

  const assessment = onboardingRes.data?.body_assessment as
    | BodyAssessment
    | undefined;
  const weeklyRate = Number(profileRes.data?.weekly_loss_rate_kg ?? 0.6);
  const program = programRes.data?.program as GeneratedProgram | null;

  const [
    foodRes,
    weightRes,
    sportRes,
    fastRes,
    periodRes,
    weeklyRes,
    latestWeightRes,
  ] = await Promise.all([
    supabase
      .from("food_logs")
      .select(
        "log_date, meal_type, items, total_calories, total_protein, created_at"
      )
      .eq("user_id", userId)
      .gte("log_date", periodStart)
      .lte("log_date", periodEnd)
      .order("log_date", { ascending: true })
      .order("created_at", { ascending: true }),
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
      .lte("log_date", periodEnd)
      .order("log_date", { ascending: true }),
    supabase
      .from("fasting_logs")
      .select("log_date, hours")
      .eq("user_id", userId)
      .gte("log_date", periodStart)
      .lte("log_date", periodEnd)
      .order("log_date", { ascending: true }),
    supabase
      .from("period_logs")
      .select("log_date")
      .eq("user_id", userId)
      .gte("log_date", periodStart)
      .lte("log_date", periodEnd)
      .order("log_date", { ascending: true }),
    supabase
      .from("weekly_assessments")
      .select("week_number, period_start, period_end, assessment")
      .eq("user_id", userId)
      .gte("week_number", (block - 1) * 4 + 1)
      .lte("week_number", block * 4)
      .order("week_number", { ascending: true }),
    supabase
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const startWeight = Number(onboardingRes.data?.current_weight_kg ?? 0);
  const currentWeight =
    latestWeightRes.data?.weight_kg != null
      ? Number(latestWeightRes.data.weight_kg)
      : startWeight;

  const weights = (weightRes.data ?? []).map((w) => ({
    date: w.log_date as string,
    weight_kg: Number(w.weight_kg),
  }));

  return {
    nickname: profileRes.data?.nickname?.trim() || "friend",
    blockNumber: block,
    programWeek,
    analysisPeriod: analysisPeriodLabel(block),
    periodStart,
    periodEnd,
    programStartedAt,
    programStartDate,
    programLengthWeeks: programWeeks,
    programEndDate: programEndDateIso(programStartedAt, programWeeks),
    weeklyLossRateKg: weeklyRate,
    goalWeightKg: assessment?.goal_weight_kg ?? currentWeight,
    currentWeightKg: currentWeight,
    goalBodyLabel: goalBodyLabel(onboardingRes.data?.goal_body_type ?? ""),
    goalBodyType: onboardingRes.data?.goal_body_type ?? "",
    calorieTarget: program?.calorie_target ?? 1700,
    proteinTarget: program?.protein_target_g ?? 120,
    program,
    foodLogs: (foodRes.data ?? []).map((row) => ({
      log_date: row.log_date as string,
      meal_type: row.meal_type as string,
      items: parseItems(row.items),
      total_calories: Number(row.total_calories),
      total_protein: Number(row.total_protein),
      logged_at: row.created_at as string,
    })),
    weights,
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
    weeklyAssessments: (weeklyRes.data ?? []).map((row) => {
      const a = row.assessment as WeeklyAssessmentData;
      return {
        week_number: row.week_number as number,
        period_start: row.period_start as string,
        period_end: row.period_end as string,
        patterns: assessmentPatterns(a).map((p) => ({
          type: p.type,
          insight: p.insight,
        })),
        highlights: a.highlights ?? [],
        motivational_message: a.motivational_message,
      };
    }),
  };
}

export function formatBlockDataForPrompt(data: FourWeekBlockPayload): string {
  const foodLines = data.foodLogs.map((r) => {
    const items = r.items
      .map((i) => `${i.food}${i.amount ? ` (${i.amount})` : ""}`)
      .join(", ");
    return `${r.log_date} ${r.meal_type} @ ${r.logged_at.slice(11, 16)}: ${items} — ${Math.round(r.total_calories)} kcal, ${r.total_protein}g protein`;
  });

  const weightLines = data.weights.map(
    (w) => `${w.date}: ${w.weight_kg} kg`
  );

  const weeklyLines = data.weeklyAssessments.map(
    (w) =>
      `Week ${w.week_number} (${w.period_start}–${w.period_end}):\n` +
      `  Patterns: ${w.patterns.map((p) => `[${p.type}] ${p.insight}`).join("; ") || "none"}\n` +
      `  Highlights: ${w.highlights.join("; ") || "none"}`
  );

  return `
PROGRAM CONTEXT:
- Goal body: ${data.goalBodyLabel} (${data.goalBodyType})
- Goal weight: ${data.goalWeightKg} kg | Current: ${data.currentWeightKg} kg
- Weekly loss target: ${data.weeklyLossRateKg} kg/week
- Expected 4-week loss: ${(data.weeklyLossRateKg * 4).toFixed(1)} kg
- Program started: ${data.programStartDate} | Planned end: ${data.programEndDate}
- Calorie target: ${data.calorieTarget} | Protein target: ${data.proteinTarget}g
- Block: ${data.analysisPeriod} (${data.periodStart} to ${data.periodEnd})

FOOD LOGS (${data.foodLogs.length} entries):
${foodLines.join("\n") || "none"}

WEIGHT LOGS:
${weightLines.join("\n") || "none"}

SPORT:
${data.sports.map((s) => `${s.date}: ${s.activity} ${s.duration_minutes}min`).join("\n") || "none"}

FASTING:
${data.fasting.map((f) => `${f.date}: ${f.hours}h`).join("\n") || "none"}

PERIOD:
${formatPeriodRanges(data.periodDays)}

WEEKLY ASSESSMENTS THIS BLOCK:
${weeklyLines.join("\n\n") || "none yet"}
`.trim();
}
