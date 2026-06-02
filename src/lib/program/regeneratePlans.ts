import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGeminiJson } from "@/lib/gemini";
import {
  buildFitnessPlanRegeneratePrompt,
  buildMealPlanRegeneratePrompt,
} from "@/lib/program/regeneratePrompts";
import {
  hasValidFitnessPlan,
  hasValidMealPlan,
} from "@/lib/program/validatePlans";
import { normalizeMealPlanStructure } from "@/lib/program/mealPlanTransform";
import type { OnboardingFormData } from "@/types/onboarding";
import type {
  GeneratedProgram,
  StructuredFitnessPlan,
  StructuredMealPlan,
} from "@/types/program";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/routing";

const MODEL = "gemini-2.5-flash";

export async function loadOnboardingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingFormData | null> {
  const { data } = await supabase
    .from("onboarding_data")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  return {
    nickname: "",
    weeklyLossRateKg: "0.6",
    currentWeightKg: String(data.current_weight_kg),
    heightCm: String(data.height_cm),
    age: String(data.age),
    sex: data.sex as OnboardingFormData["sex"],
    goalBodyType: data.goal_body_type as OnboardingFormData["goalBodyType"],
    currentBodyDescription: data.current_body_description ?? "",
    assessment: data.body_assessment as OnboardingFormData["assessment"],
    cuisines: data.cuisines ?? "",
    sweetsFrequency: data.sweets_frequency ?? "",
    sportsEnjoyed: data.sports_enjoyed ?? "",
    exerciseFrequency: data.exercise_frequency ?? "",
    cookFrequency: data.cook_frequency ?? "",
    mealsPerDay: data.meals_per_day ?? "",
    eatingSchedule: data.eating_schedule ?? "",
    snacks: data.snacks ?? "",
    recentEating: data.recent_eating ?? "",
    dietaryRestrictions: data.dietary_restrictions ?? "",
  };
}

export async function regenerateMealPlan(
  onboarding: OnboardingFormData,
  program: GeneratedProgram,
  locale: Locale = "en"
): Promise<StructuredMealPlan> {
  const raw = await generateGeminiJson<StructuredMealPlan>(
    buildMealPlanRegeneratePrompt(onboarding, {
      calorie_target: program.calorie_target,
      protein_target_g: program.protein_target_g,
    }),
    "Output valid JSON only. Meal prep structure with max 4 unique dishes for 2-3x/week cooks.",
    MODEL,
    locale
  );
  return normalizeMealPlanStructure(raw, onboarding.cookFrequency);
}

export async function regenerateFitnessPlan(
  onboarding: OnboardingFormData,
  locale: Locale = "en"
): Promise<StructuredFitnessPlan> {
  return generateGeminiJson<StructuredFitnessPlan>(
    buildFitnessPlanRegeneratePrompt(onboarding),
    "Output valid JSON only.",
    MODEL,
    locale
  );
}

export async function ensureProgramPlans(
  supabase: SupabaseClient,
  userId: string,
  part: "meal" | "fitness" | "both" = "both",
  locale: Locale = "en"
): Promise<GeneratedProgram> {
  const { data: row } = await supabase
    .from("user_programs")
    .select("program")
    .eq("user_id", userId)
    .eq("block_number", 1)
    .single();

  if (!row?.program) throw new Error("Program not found");

  let program = row.program as GeneratedProgram;
  const onboarding = await loadOnboardingForUser(supabase, userId);
  if (!onboarding) throw new Error("Onboarding data not found");

  const cookFreq = onboarding.cookFrequency;

  const needMeal =
    (part === "meal" || part === "both") &&
    !hasValidMealPlan(program.meal_plan, cookFreq);
  const needFitness =
    (part === "fitness" || part === "both") &&
    !hasValidFitnessPlan(program.fitness_plan);

  if (needMeal) {
    program = {
      ...program,
      meal_plan: await regenerateMealPlan(onboarding, program, locale),
    };
  } else if (program.meal_plan && hasValidMealPlan(program.meal_plan, cookFreq)) {
    program = {
      ...program,
      meal_plan: normalizeMealPlanStructure(program.meal_plan, cookFreq),
    };
  }

  if (needFitness) {
    program = {
      ...program,
      fitness_plan: await regenerateFitnessPlan(onboarding, locale),
    };
  }

  if (needMeal || needFitness) {
    const admin = createServiceRoleClient();
    await admin
      .from("user_programs")
      .update({ program })
      .eq("user_id", userId)
      .eq("block_number", 1);
  }

  return program;
}
