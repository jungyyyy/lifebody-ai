import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import { generateGeminiJson } from "@/lib/gemini";
import { normalizeProgram } from "@/lib/program/normalize";
import { normalizeMealPlanStructure } from "@/lib/program/mealPlanTransform";
import {
  buildMealPlanAdjustPrompt,
  type MealPlanAdjustResult,
} from "@/lib/program/prompts";
import type { BodyAssessment } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";

export async function POST(request: Request) {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  const { message } = await request.json();
  const text = String(message ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const [programRes, onboardingRes] = await Promise.all([
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", user!.id)
      .eq("block_number", 1)
      .single(),
    supabase
      .from("onboarding_data")
      .select("current_weight_kg, body_assessment")
      .eq("user_id", user!.id)
      .single(),
  ]);

  if (!programRes.data?.program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const assessment = onboardingRes.data?.body_assessment as
    | BodyAssessment
    | undefined;
  const currentWeight = Number(onboardingRes.data?.current_weight_kg ?? 70);
  const goalWeight = assessment?.goal_weight_kg ?? currentWeight;

  const full = normalizeProgram(programRes.data.program as GeneratedProgram, {
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
  });

  try {
    const result = await generateGeminiJson<MealPlanAdjustResult>(
      buildMealPlanAdjustPrompt(full, text)
    );

    const { data: onboardingData } = await supabase
      .from("onboarding_data")
      .select("cook_frequency")
      .eq("user_id", user!.id)
      .single();

    const meal_plan = normalizeMealPlanStructure(
      result.meal_plan,
      onboardingData?.cook_frequency ?? "2-3x"
    );

    const updated: GeneratedProgram = {
      ...(programRes.data.program as GeneratedProgram),
      meal_plan,
    };

    const { error: saveError } = await supabase
      .from("user_programs")
      .update({ program: updated })
      .eq("user_id", user!.id)
      .eq("block_number", 1);

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: result.message,
      program: normalizeProgram(updated, {
        currentWeightKg: currentWeight,
        goalWeightKg: goalWeight,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update meal plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
