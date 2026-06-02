import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { generateGeminiJson } from "@/lib/gemini";
import { buildProgramPrompt } from "@/lib/onboarding/prompts";
import { upsertOnboardingData } from "@/lib/onboarding/db";
import { getFastingRecommendation } from "@/lib/program/bmi";
import {
  calculateProgramWeeks,
  weightToLoseKg,
} from "@/lib/program/duration";
import { normalizeProgram } from "@/lib/program/normalize";
import { normalizeMealPlanStructure } from "@/lib/program/mealPlanTransform";
import {
  regenerateFitnessPlan,
  regenerateMealPlan,
} from "@/lib/program/regeneratePlans";
import {
  beginnerWorkoutNote,
  calculateProgramTargets,
} from "@/lib/program/calorieTargets";
import {
  hasValidFitnessPlan,
  hasValidMealPlan,
} from "@/lib/program/validatePlans";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { OnboardingFormData } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as OnboardingFormData;

  if (!body.assessment) {
    return NextResponse.json(
      { error: "Body assessment is required" },
      { status: 400 }
    );
  }

  try {
    const weight = parseFloat(body.currentWeightKg);
    const height = parseFloat(body.heightCm);
    const weeklyRate = parseFloat(body.weeklyLossRateKg || "0.6");
    const age = parseInt(body.age || "25", 10) || 25;
    const programWeeks = calculateProgramWeeks(
      weightToLoseKg(weight, body.assessment.goal_weight_kg),
      weeklyRate
    );
    const calculation = calculateProgramTargets({
      weightKg: weight,
      heightCm: height,
      age,
      sex: body.sex || "prefer_not_to_say",
      exerciseFrequency: body.exerciseFrequency,
      weeklyLossRateKg: weeklyRate,
    });

    const program = await generateGeminiJson<GeneratedProgram>(
      buildProgramPrompt(body, body.assessment, calculation)
    );

    program.program_length_weeks = programWeeks;
    // Hard enforce calculated targets; Gemini must not freestyle nutrition numbers.
    program.calorie_target = calculation.final_calories;
    program.protein_target_g = calculation.final_protein_g;
    program.weekly_fat_loss_kg = calculation.actual_weekly_loss_kg;
    program.calculation = calculation;

    const fasting = getFastingRecommendation(weight, height);
    program.fasting_window = fasting.window;
    program.fasting_is_intermittent = fasting.isIntermittentFasting;

    if (calculation.floor_applied) {
      const floorMsg =
        body.sex === "female"
          ? `I adjusted your calories to ${calculation.final_calories} kcal — the safe minimum for women. At this level you'll lose about ${calculation.actual_weekly_loss_kg}kg/week instead of ${weeklyRate}.`
          : `I adjusted your calories to ${calculation.final_calories} kcal — the safe minimum for men. At this level you'll lose about ${calculation.actual_weekly_loss_kg}kg/week instead of ${weeklyRate}.`;
      program.maintenance_note = program.maintenance_note
        ? `${program.maintenance_note} ${floorMsg}`
        : floorMsg;
      program.block_summary = `${program.block_summary} ${floorMsg}`;
    }

    const beginnerNote = beginnerWorkoutNote(body.exerciseFrequency);
    if (beginnerNote) {
      program.exercise_plan.overview = `${program.exercise_plan.overview} ${beginnerNote}`;
      if (program.fitness_plan) {
        program.fitness_plan.sessions_per_week = Math.max(
          1,
          Math.min(2, program.fitness_plan.sessions_per_week || 1)
        );
      }
    }

    if (!hasValidMealPlan(program.meal_plan)) {
      program.meal_plan = await regenerateMealPlan(body, program);
    }
    if (!hasValidFitnessPlan(program.fitness_plan)) {
      program.fitness_plan = await regenerateFitnessPlan(body);
    }

    const { error: onboardingError } = await upsertOnboardingData(
      supabase,
      user!.id,
      body
    );

    if (onboardingError) {
      return NextResponse.json({ error: onboardingError.message }, { status: 500 });
    }

    if (program.meal_plan) {
      program.meal_plan = normalizeMealPlanStructure(
        program.meal_plan,
        body.cookFrequency
      );
    }

    const normalized = normalizeProgram(program, {
      currentWeightKg: weight,
      goalWeightKg: body.assessment.goal_weight_kg,
      cookFrequency: body.cookFrequency,
    });

    const admin = createServiceRoleClient();
    await admin.from("user_programs").upsert(
      {
        user_id: user!.id,
        block_number: 1,
        program: normalized,
      },
      { onConflict: "user_id,block_number" }
    );

    await admin
      .from("profiles")
      .update({
        weekly_loss_rate_kg: weeklyRate,
        program_length_weeks: programWeeks,
      })
      .eq("id", user!.id);

    return NextResponse.json({ program: normalized });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Program generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
