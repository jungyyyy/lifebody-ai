import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGeminiJson } from "@/lib/gemini";
import { normalizeProgram } from "@/lib/program/normalize";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  buildMealPlanAdjustPrompt,
  type MealPlanAdjustResult,
} from "@/lib/program/prompts";
import type { WeeklyAssessmentData } from "@/types/assessment";
import type { BodyAssessment } from "@/types/onboarding";
import type { GeneratedProgram, FullProgram } from "@/types/program";

const ASSESSMENT_MODEL = "gemini-2.5-flash";

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export async function applyAssessmentProgramUpdates(
  supabase: SupabaseClient,
  userId: string,
  assessment: WeeklyAssessmentData
): Promise<FullProgram | null> {
  const updates = assessment.program_updates;
  const rules = uniqueStrings([
    ...(assessment.program_rule_updates ?? []),
    ...(updates?.rule_notes ?? []),
  ]);

  const fastingChange =
    updates?.fasting_window != null ||
    updates?.fasting_is_intermittent != null;

  const mealRequest =
    updates?.meal_plan_adjustment_request?.trim() ||
    (assessment.next_week_meal_plan_changes &&
    !/no meal plan changes/i.test(assessment.next_week_meal_plan_changes)
      ? assessment.next_week_meal_plan_changes
      : null);

  if (rules.length === 0 && !fastingChange && !mealRequest) {
    return null;
  }

  const [programRes, onboardingRes] = await Promise.all([
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", userId)
      .eq("block_number", 1)
      .single(),
    supabase
      .from("onboarding_data")
      .select("current_weight_kg, body_assessment")
      .eq("user_id", userId)
      .single(),
  ]);

  if (!programRes.data?.program) return null;

  const assessmentBody = onboardingRes.data?.body_assessment as
    | BodyAssessment
    | undefined;
  const currentWeight = Number(onboardingRes.data?.current_weight_kg ?? 70);
  const goalWeight = assessmentBody?.goal_weight_kg ?? currentWeight;

  let program = programRes.data.program as GeneratedProgram;
  let full = normalizeProgram(program, {
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
  });

  if (rules.length > 0) {
    const existing = full.mindset_notes ?? [];
    const toAdd = rules.filter(
      (r) =>
        !existing.some((e) =>
          e.toLowerCase().includes(r.toLowerCase().slice(0, 24))
        )
    );
    if (toAdd.length > 0) {
      program = {
        ...program,
        mindset_notes: [
          ...existing,
          ...toAdd.map((r) => `Coach rule: ${r}`),
        ],
      };
    }
  }

  if (fastingChange) {
    program = {
      ...program,
      ...(updates?.fasting_window != null
        ? { fasting_window: updates.fasting_window }
        : {}),
      ...(updates?.fasting_is_intermittent != null
        ? { fasting_is_intermittent: updates.fasting_is_intermittent }
        : {}),
    };
  }

  if (mealRequest) {
    const context = assessment.patterns_detected?.length
      ? `${mealRequest}\n\nContext from weekly assessment patterns:\n${assessment.patterns_detected.map((p) => `- ${p.insight}`).join("\n")}`
      : mealRequest;

    const result = await generateGeminiJson<MealPlanAdjustResult>(
      buildMealPlanAdjustPrompt(full, context),
      undefined,
      ASSESSMENT_MODEL
    );
    program = {
      ...program,
      meal_plan: result.meal_plan,
    };
  }

  const normalized = normalizeProgram(program, {
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
  });

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("user_programs")
    .update({ program: normalized })
    .eq("user_id", userId)
    .eq("block_number", 1);

  if (error) throw new Error(error.message);

  return normalized;
}
