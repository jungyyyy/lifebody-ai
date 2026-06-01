import type {
  GeneratedProgram,
  StructuredFitnessPlan,
  StructuredMealPlan,
} from "@/types/program";
import { maxUniqueRecipesForCookFrequency } from "@/lib/program/cookFrequency";

function validMealName(name: string | undefined): boolean {
  const n = name?.trim() ?? "";
  if (!n) return false;
  if (/^(meal|breakfast|lunch|dinner|snack)\s*\d*$/i.test(n)) return false;
  return true;
}

function validMealSet(set: StructuredMealPlan["meal_sets"]["set_a"]): boolean {
  return (
    validMealName(set.breakfast) &&
    validMealName(set.lunch) &&
    validMealName(set.dinner) &&
    set.snack_budget_kcal >= 100 &&
    set.snack_budget_kcal <= 400 &&
    Array.isArray(set.snack_suggestions)
  );
}

export function hasValidMealPlan(
  plan: StructuredMealPlan | undefined | null,
  cookFrequency = "2-3x"
): boolean {
  if (!plan?.meal_sets?.set_a || !plan.meal_sets?.set_b) return false;
  if (!validMealSet(plan.meal_sets.set_a) || !validMealSet(plan.meal_sets.set_b)) {
    return false;
  }
  if (!plan.meal_prep_schedule?.session_1 || !plan.meal_prep_schedule?.session_2) {
    return false;
  }
  if (!plan.recipes?.length) return false;

  const maxRecipes = maxUniqueRecipesForCookFrequency(cookFrequency);
  if (plan.recipes.length > maxRecipes) return false;

  const uniqueDishNames = new Set<string>();
  for (const set of [plan.meal_sets.set_a, plan.meal_sets.set_b]) {
    uniqueDishNames.add(set.breakfast.trim().toLowerCase());
    uniqueDishNames.add(set.lunch.trim().toLowerCase());
    uniqueDishNames.add(set.dinner.trim().toLowerCase());
  }
  if (uniqueDishNames.size > maxRecipes) return false;

  return plan.recipes.every(
    (r) =>
      r.meal_name?.trim() &&
      r.ingredients_per_serving?.length >= 2 &&
      r.steps?.length >= 2 &&
      typeof r.calories_per_serving === "number" &&
      typeof r.protein_per_serving === "number" &&
      typeof r.carbs_per_serving === "number" &&
      typeof r.fat_per_serving === "number" &&
      typeof r.fiber_per_serving === "number" &&
      r.servings_per_week >= 1
  );
}

export function hasValidFitnessPlan(
  plan: StructuredFitnessPlan | undefined | null
): boolean {
  if (!plan?.sessions?.length || plan.sessions.length < 2) return false;
  return plan.sessions.every(
    (s) =>
      s.session_name?.trim() &&
      s.exercises?.length >= 4 &&
      s.exercises.every(
        (e) =>
          e.name?.trim() &&
          typeof e.sets === "number" &&
          typeof e.reps === "number" &&
          typeof e.rest_seconds === "number" &&
          e.coaching_tip?.trim()
      )
  );
}

export function programNeedsMealRegeneration(
  program: GeneratedProgram,
  cookFrequency?: string
): boolean {
  return !hasValidMealPlan(program.meal_plan, cookFrequency);
}

export function programNeedsFitnessRegeneration(
  program: GeneratedProgram
): boolean {
  return !hasValidFitnessPlan(program.fitness_plan);
}
