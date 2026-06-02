import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGeminiJson } from "@/lib/gemini";
import { applyAssessmentProgramUpdates } from "@/lib/assessment/applyProgramUpdates";
import { fetchAssessmentHistory } from "@/lib/assessment/historyData";
import { buildWeeklyAssessmentPrompt } from "@/lib/assessment/prompts";
import { lastSevenDaysRange } from "@/lib/assessment/weekData";
import type { WeeklyAssessmentData } from "@/types/assessment";
import type { Locale } from "@/i18n/routing";

const ASSESSMENT_MODEL = "gemini-2.5-flash";

function normalizeAssessment(raw: WeeklyAssessmentData): WeeklyAssessmentData {
  return {
    ...raw,
    patterns_detected: Array.isArray(raw.patterns_detected)
      ? raw.patterns_detected
      : [],
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    program_rule_updates: Array.isArray(raw.program_rule_updates)
      ? raw.program_rule_updates
      : [],
    next_week_meal_plan_changes:
      raw.next_week_meal_plan_changes ??
      raw.next_week_adjustment ??
      raw.meal_plan_update ??
      "No meal plan changes needed.",
    motivational_message: raw.motivational_message ?? "Keep going — you're building real habits.",
    insufficient_data_note: raw.insufficient_data_note ?? null,
    program_updates: raw.program_updates ?? null,
  };
}

export async function generateWeeklyAssessment(
  supabase: SupabaseClient,
  userId: string,
  options?: { periodEnd?: string; weekNumber?: number; locale?: Locale }
) {
  const { periodStart, periodEnd } = lastSevenDaysRange(options?.periodEnd);
  const history = await fetchAssessmentHistory(
    supabase,
    userId,
    periodStart,
    periodEnd
  );

  const weekNumber = options?.weekNumber ?? history.programWeek;
  const stats = history.currentWeekStats;

  let assessment = normalizeAssessment(
    await generateGeminiJson<WeeklyAssessmentData>(
      buildWeeklyAssessmentPrompt(history),
      "You are an evidence-based health coach. Only report patterns supported by the user's log data. Output valid JSON only.",
      ASSESSMENT_MODEL,
      options?.locale ?? "en"
    )
  );

  assessment.week_number = weekNumber;
  assessment.avg_daily_calories = stats.avgDailyCalories;
  assessment.avg_daily_protein = stats.avgDailyProtein;
  assessment.days_journaled = stats.daysJournaled;
  assessment.sport_sessions = stats.sportsSessions;
  assessment.avg_fasting_hours = stats.avgFastingHours;
  if (stats.weightChangeKg != null) {
    assessment.weight_change_kg = Math.round(stats.weightChangeKg * 10) / 10;
  } else if (assessment.weight_change_kg == null) {
    assessment.weight_change_kg = 0;
  }

  if (
    history.weeksWithFoodLogs < 2 &&
    !assessment.insufficient_data_note
  ) {
    assessment.insufficient_data_note =
      "I need a couple more weeks of data to spot your patterns. Keep logging — I'm watching and learning.";
  }

  const { data: saved, error } = await supabase
    .from("weekly_assessments")
    .upsert(
      {
        user_id: userId,
        week_number: weekNumber,
        period_start: periodStart,
        period_end: periodEnd,
        assessment,
      },
      { onConflict: "user_id,week_number" }
    )
    .select("id, week_number, period_start, period_end, assessment, created_at")
    .single();

  if (error) throw new Error(error.message);

  try {
    await applyAssessmentProgramUpdates(
      supabase,
      userId,
      assessment,
      options?.locale ?? "en"
    );
  } catch (err) {
    console.error("Program update after assessment failed:", err);
  }

  return saved;
}
