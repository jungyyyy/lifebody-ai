import type { FullProgram, WeeklyMealPlan } from "@/types/program";

export function buildMealPlanAdjustPrompt(
  program: FullProgram,
  userMessage: string
): string {
  return `You are LifeBody AI's meal plan assistant. The user wants to adjust their weekly meal plan.

USER REQUEST: "${userMessage}"

CURRENT PROGRAM TARGETS:
- ${program.calorie_target} kcal/day, ${program.protein_target_g}g protein/day
- ${program.meal_structure.overview}

Return ONLY valid JSON updating the full week:
{
  "weekly_meal_plan": {
    "monday": { "breakfast": meal, "lunch": meal, "dinner": meal, "snack": meal },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... },
    "sunday": { ... }
  },
  "grocery_list": string[] (all ingredients for the updated week),
  "message": string (brief friendly confirmation of what changed)
}

meal = { "name": string, "calories": number, "protein": number, "recipe": string, "ingredients": string[] }

Apply the user's request (e.g. dinner out Thursday) while keeping other days sensible. Recalculate affected days only if needed, but return the complete weekly_meal_plan object.

Current plan JSON:
${JSON.stringify(program.weekly_meal_plan).slice(0, 12000)}`;
}

export interface MealPlanAdjustResult {
  weekly_meal_plan: WeeklyMealPlan;
  grocery_list: string[];
  message: string;
}
