import type { SupabaseClient } from "@supabase/supabase-js";
import { daysBetween } from "@/lib/dates";
import { programEndDate } from "@/lib/program/dates";
import {
  calculateProgramWeeks,
  weightToLoseKg,
} from "@/lib/program/duration";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";
import type { GeneratedProgram } from "@/types/program";

function parseDateOnly(iso: string): string {
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

export async function applyFourWeekRecalibration(
  supabase: SupabaseClient,
  userId: string,
  analysis: FourWeekAnalysisData,
  ctx: {
    programStartedAt: string;
    weeklyLossRateKg: number;
    currentWeightKg: number;
    goalWeightKg: number;
    programLengthWeeks: number;
  }
): Promise<{ updatedEndDate: string; programLengthWeeks: number }> {
  const originalEnd = parseDateOnly(analysis.program_recalibration.original_end_date);
  let updatedEnd = parseDateOnly(analysis.program_recalibration.updated_end_date);
  const programStart = parseDateOnly(ctx.programStartedAt);

  const weeksElapsed = Math.max(
    1,
    Math.ceil(daysBetween(ctx.programStartedAt) / 7)
  );

  const remainingKg = weightToLoseKg(ctx.currentWeightKg, ctx.goalWeightKg);
  const dataDrivenWeeks =
    weeksElapsed +
    calculateProgramWeeks(remainingKg, ctx.weeklyLossRateKg);

  if (analysis.pace === "behind" && remainingKg > 0) {
    const fromPace = Math.max(ctx.programLengthWeeks, dataDrivenWeeks);
    updatedEnd = programEndDate(ctx.programStartedAt, fromPace);
  } else if (
    updatedEnd !== originalEnd &&
    analysis.program_recalibration.reason?.trim()
  ) {
    // use Gemini suggestion if provided
  } else {
    updatedEnd = originalEnd;
  }

  const newLengthWeeks = Math.max(
    ctx.programLengthWeeks,
    weeksElapsed + calculateProgramWeeks(remainingKg, ctx.weeklyLossRateKg)
  );
  updatedEnd = programEndDate(ctx.programStartedAt, newLengthWeeks);

  if (updatedEnd === originalEnd && newLengthWeeks === ctx.programLengthWeeks) {
    return {
      updatedEndDate: originalEnd,
      programLengthWeeks: ctx.programLengthWeeks,
    };
  }

  analysis.program_recalibration.updated_end_date = updatedEnd;
  if (updatedEnd !== originalEnd && !analysis.program_recalibration.reason) {
    analysis.program_recalibration.reason =
      "Adjusted based on your actual 4-week progress vs plan.";
  }

  const admin = createServiceRoleClient();

  await admin
    .from("profiles")
    .update({ program_length_weeks: newLengthWeeks })
    .eq("id", userId);

  const { data: progRow } = await supabase
    .from("user_programs")
    .select("program")
    .eq("user_id", userId)
    .eq("block_number", 1)
    .single();

  if (progRow?.program) {
    const program = progRow.program as GeneratedProgram;
    let maintenance_note = program.maintenance_note;
    if (analysis.maintenance_break_recommended && analysis.maintenance_break_message) {
      maintenance_note = analysis.maintenance_break_message;
    }
    await admin
      .from("user_programs")
      .update({
        program: {
          ...program,
          program_length_weeks: newLengthWeeks,
          maintenance_note,
          ...(analysis.maintenance_break_recommended
            ? {
                maintenance_break: {
                  show: true,
                  start_after_week: ctx.programLengthWeeks,
                  duration_label: "4–8 weeks",
                },
              }
            : {}),
        },
      })
      .eq("user_id", userId)
      .eq("block_number", 1);
  }

  return { updatedEndDate: updatedEnd, programLengthWeeks: newLengthWeeks };
}
