import type { FullProgram } from "@/types/program";
import { cookFrequencyGuidance } from "@/lib/program/cookFrequency";

export function buildMealPlanAdjustPrompt(
  program: FullProgram,
  userMessage: string
): string {
  const cookGuide = cookFrequencyGuidance("2-3x");

  return `You are LifeBody AI's meal prep assistant. Adjust the user's weekly meal plan.

USER REQUEST: "${userMessage}"

TARGETS: ${program.calorie_target} kcal/day, ${program.protein_target_g}g protein/day

${cookGuide}

MEAL PREP RULES: Set A Mon-Wed, Set B Thu-Sun. Max 4 unique recipes. Snacks are flexible budget only.

Return ONLY valid JSON:
{
  "meal_plan": {
    "meal_sets": { "set_a": {...}, "set_b": {...} },
    "recipes": [...],
    "meal_prep_schedule": { "session_1": {...}, "session_2": {...} }
  },
  "message": string
}

Current plan:
${JSON.stringify(program.meal_plan).slice(0, 12000)}`;
}

export interface MealPlanAdjustResult {
  meal_plan: FullProgram["meal_plan"];
  message: string;
}
