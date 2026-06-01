import type {
  DayDisplayName,
  MealPlanDay,
  MealPrepSchedule,
  MealPrepSet,
  MealRecipe,
  MealSlot,
  StructuredMealPlan,
} from "@/types/program";
import {
  DAY_DISPLAY_NAMES,
  KEY_TO_DISPLAY_NAME,
  WEEKDAYS,
} from "@/types/program";
import { maxUniqueRecipesForCookFrequency } from "@/lib/program/cookFrequency";

const SET_A_DAYS: DayDisplayName[] = ["Monday", "Tuesday", "Wednesday"];
const SET_B_DAYS: DayDisplayName[] = [
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function snackLabelForSet(set: MealPrepSet): string {
  const ideas =
    set.snack_suggestions.length > 0
      ? set.snack_suggestions.slice(0, 2).join(", ")
      : "your choice";
  return `~${set.snack_budget_kcal} kcal flexible (${ideas})`;
}

export function expandWeekFromMealSets(plan: StructuredMealPlan): MealPlanDay[] {
  const { set_a, set_b } = plan.meal_sets;
  const byDay = new Map<DayDisplayName, MealPlanDay>();

  for (const day of set_a.days) {
    byDay.set(day, {
      day,
      meals: {
        breakfast: set_a.breakfast,
        lunch: set_a.lunch,
        dinner: set_a.dinner,
        snack: snackLabelForSet(set_a),
      },
    });
  }
  for (const day of set_b.days) {
    byDay.set(day, {
      day,
      meals: {
        breakfast: set_b.breakfast,
        lunch: set_b.lunch,
        dinner: set_b.dinner,
        snack: snackLabelForSet(set_b),
      },
    });
  }

  return DAY_DISPLAY_NAMES.map((day) => {
    if (byDay.has(day)) return byDay.get(day)!;
    const inA = set_a.days.includes(day);
    const set = inA ? set_a : set_b;
    return {
      day,
      meals: {
        breakfast: set.breakfast,
        lunch: set.lunch,
        dinner: set.dinner,
        snack: snackLabelForSet(set),
      },
    };
  });
}

export function portionsFromPrepSchedule(
  schedule: MealPrepSchedule
): Map<string, number> {
  const map = new Map<string, number>();
  for (const session of [schedule.session_1, schedule.session_2]) {
    if (!session?.portions_to_make) continue;
    for (const [dish, count] of Object.entries(session.portions_to_make)) {
      const key = dish.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + Number(count));
    }
  }
  return map;
}

export function syncRecipeServingsFromSchedule(
  plan: StructuredMealPlan
): StructuredMealPlan {
  const portions = portionsFromPrepSchedule(plan.meal_prep_schedule);
  const recipes = plan.recipes.map((r) => {
    const key = r.meal_name.trim().toLowerCase();
    const fromSchedule = portions.get(key);
    return {
      ...r,
      servings_per_week: fromSchedule ?? r.servings_per_week,
    };
  });
  return {
    ...plan,
    recipes,
    week: expandWeekFromMealSets({ ...plan, recipes }),
  };
}

export function normalizeMealPlanStructure(
  raw: StructuredMealPlan,
  cookFrequency: string
): StructuredMealPlan {
  let plan = raw;

  if (!plan.meal_sets?.set_a || !plan.meal_sets?.set_b) {
    throw new Error("Meal plan missing meal_sets");
  }

  plan.meal_sets.set_a.days = SET_A_DAYS;
  plan.meal_sets.set_b.days = SET_B_DAYS;

  const maxRecipes = maxUniqueRecipesForCookFrequency(cookFrequency);
  if (plan.recipes.length > maxRecipes) {
    plan = { ...plan, recipes: plan.recipes.slice(0, maxRecipes) };
  }

  plan = syncRecipeServingsFromSchedule(plan);
  plan.week = expandWeekFromMealSets(plan);
  return plan;
}

export function mealNameForSlot(
  plan: StructuredMealPlan,
  dayKey: (typeof WEEKDAYS)[number],
  slot: MealSlot
): string {
  const week = plan.week ?? expandWeekFromMealSets(plan);
  const dayName = KEY_TO_DISPLAY_NAME[dayKey];
  const day = week.find((d) => d.day === dayName);
  return day?.meals[slot] ?? "";
}

export function isCookableMealName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n.includes("flexible") || n.includes("kcal")) return false;
  return true;
}

export function portionsForRecipe(
  plan: StructuredMealPlan,
  recipe: MealRecipe
): number {
  const portions = portionsFromPrepSchedule(plan.meal_prep_schedule);
  return (
    portions.get(recipe.meal_name.trim().toLowerCase()) ??
    recipe.servings_per_week
  );
}

export function scaledIngredientsForPortions(
  recipe: MealRecipe,
  totalPortions: number
): { name: string; amount: number; unit: string }[] {
  return recipe.ingredients_per_serving.map((ing) => ({
    name: ing.name,
    amount: Math.round(ing.amount * totalPortions * 10) / 10,
    unit: ing.unit,
  }));
}
