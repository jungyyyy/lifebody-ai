import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGeminiJson } from "@/lib/gemini";
import { applyFourWeekRecalibration } from "@/lib/four-week/applyRecalibration";
import {
  fetchFourWeekBlockData,
} from "@/lib/four-week/fetchBlockData";
import { buildFourWeekAnalysisPrompt } from "@/lib/four-week/prompts";
import { weekRangeLabel } from "@/lib/four-week/block";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";
import { localDateString } from "@/lib/dates";

const FOUR_WEEK_MODEL = "gemini-2.5-flash";

function normalizeAnalysis(
  raw: FourWeekAnalysisData,
  data: Awaited<ReturnType<typeof fetchFourWeekBlockData>>
): FourWeekAnalysisData {
  const expected = data.weeklyLossRateKg * 4;
  let totalChange = raw.total_weight_change_kg;
  if (data.weights.length >= 2) {
    totalChange =
      Math.round(
        (data.weights[0].weight_kg -
          data.weights[data.weights.length - 1].weight_kg) *
          10
      ) / 10;
  }

  return {
    ...raw,
    analysis_period: raw.analysis_period ?? data.analysisPeriod,
    total_weight_change_kg: totalChange,
    expected_weight_change_kg: raw.expected_weight_change_kg ?? expected,
    long_term_patterns: Array.isArray(raw.long_term_patterns)
      ? raw.long_term_patterns
      : [],
    next_4_weeks_focus: Array.isArray(raw.next_4_weeks_focus)
      ? raw.next_4_weeks_focus.slice(0, 5)
      : [],
    maintenance_break_message: raw.maintenance_break_recommended
      ? raw.maintenance_break_message
      : null,
    program_recalibration: {
      original_end_date:
        raw.program_recalibration?.original_end_date ?? data.programEndDate,
      updated_end_date:
        raw.program_recalibration?.updated_end_date ?? data.programEndDate,
      reason: raw.program_recalibration?.reason ?? "",
    },
  };
}

export async function generateFourWeekAnalysis(
  supabase: SupabaseClient,
  userId: string,
  blockNumber: number
) {
  const data = await fetchFourWeekBlockData(supabase, userId, blockNumber);

  let analysis = normalizeAnalysis(
    await generateGeminiJson<FourWeekAnalysisData>(
      buildFourWeekAnalysisPrompt(data),
      "You are an evidence-based coach. Only report patterns supported by log data. Output valid JSON.",
      FOUR_WEEK_MODEL
    ),
    data
  );

  try {
    const { updatedEndDate } = await applyFourWeekRecalibration(
      supabase,
      userId,
      analysis,
      {
        programStartedAt: data.programStartedAt,
        weeklyLossRateKg: data.weeklyLossRateKg,
        currentWeightKg: data.currentWeightKg,
        goalWeightKg: data.goalWeightKg,
        programLengthWeeks: data.programLengthWeeks,
      }
    );
    analysis.program_recalibration.updated_end_date = updatedEndDate;
  } catch (err) {
    console.error("Four-week recalibration failed:", err);
  }

  const admin = createServiceRoleClient();
  const today = localDateString();

  const { data: saved, error } = await admin
    .from("four_week_analyses")
    .upsert(
      {
        user_id: userId,
        block_number: blockNumber,
        week_range: weekRangeLabel(blockNumber),
        period_start: data.periodStart,
        period_end: data.periodEnd,
        analysis,
      },
      { onConflict: "user_id,block_number" }
    )
    .select(
      "id, block_number, week_range, period_start, period_end, analysis, created_at"
    )
    .single();

  if (error) throw new Error(error.message);

  await admin
    .from("profiles")
    .update({ last_4week_analysis_at: today })
    .eq("id", userId);

  return saved;
}
