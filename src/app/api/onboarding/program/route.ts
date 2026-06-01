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
    const programWeeks = calculateProgramWeeks(
      weightToLoseKg(weight, body.assessment.goal_weight_kg),
      weeklyRate
    );

    const program = await generateGeminiJson<GeneratedProgram>(
      buildProgramPrompt(body, body.assessment)
    );

    program.program_length_weeks = programWeeks;
    program.calorie_target = Math.max(1450, program.calorie_target);
    program.protein_target_g = Math.max(
      90,
      Math.round(weight * 1.8),
      program.protein_target_g
    );
    program.weekly_fat_loss_kg = weeklyRate;

    const fasting = getFastingRecommendation(weight, height);
    program.fasting_window = fasting.window;
    program.fasting_is_intermittent = fasting.isIntermittentFasting;

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
