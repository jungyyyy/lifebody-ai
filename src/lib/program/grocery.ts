import type { MealIngredient, MealRecipe, StructuredMealPlan } from "@/types/program";
import { portionsFromPrepSchedule } from "@/lib/program/mealPlanTransform";

export interface GroceryItem {
  name: string;
  amount: number;
  unit: string;
  category: GroceryCategoryId;
}

export type GroceryCategoryId =
  | "proteins"
  | "vegetables"
  | "grains"
  | "dairy"
  | "pantry"
  | "other";

export const GROCERY_CATEGORIES: {
  id: GroceryCategoryId;
  label: string;
  emoji: string;
}[] = [
  { id: "proteins", label: "Proteins", emoji: "🥩" },
  { id: "vegetables", label: "Vegetables & Fruits", emoji: "🥦" },
  { id: "grains", label: "Grains & Carbs", emoji: "🌾" },
  { id: "dairy", label: "Dairy & Eggs", emoji: "🧀" },
  { id: "pantry", label: "Pantry & Condiments", emoji: "🫙" },
  { id: "other", label: "Other", emoji: "🛒" },
];

function normalizeIngredientKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;
}

function categorizeIngredient(name: string): GroceryCategoryId {
  const n = name.toLowerCase();
  if (
    /chicken|beef|pork|fish|salmon|tuna|turkey|mince|shrimp|prawn|tofu|tempeh|protein powder|steak|lamb|bacon|sausage|ham/.test(
      n
    )
  ) {
    return "proteins";
  }
  if (
    /egg|milk|yogurt|greek yogurt|cheese|cottage|cream|butter|feta|mozzarella|parmesan/.test(
      n
    )
  ) {
    return "dairy";
  }
  if (
    /rice|pasta|noodle|bread|oat|quinoa|buckwheat|tortilla|wrap|potato|sweet potato|flour|cereal|granola/.test(
      n
    )
  ) {
    return "grains";
  }
  if (
    /broccoli|spinach|kale|lettuce|tomato|onion|garlic|pepper|carrot|cucumber|apple|banana|berry|berries|avocado|mushroom|zucchini|cabbage|kimchi|vegetable|fruit|salad|lemon|lime/.test(
      n
    )
  ) {
    return "vegetables";
  }
  if (
    /oil|sauce|soy|vinegar|spice|salt|pepper|honey|sugar|stock|broth|sesame|mustard|ketchup|mayo|paste|curry|paprika|cumin/.test(
      n
    )
  ) {
    return "pantry";
  }
  return "other";
}

function formatAmount(amount: number, unit: string): string {
  const u = unit.toLowerCase();
  if (u === "g" || u === "gram" || u === "grams") {
    if (amount >= 1000) return `${Math.round((amount / 1000) * 10) / 10}kg`;
    return `${Math.round(amount)}g`;
  }
  if (u === "ml") {
    if (amount >= 1000) return `${Math.round((amount / 1000) * 10) / 10}L`;
    return `${Math.round(amount)}ml`;
  }
  if (u === "whole" || u === "unit" || u === "pcs") {
    return `${Math.round(amount)}`;
  }
  return `${Math.round(amount * 10) / 10}${unit}`;
}

export function buildConsolidatedGroceryList(
  mealPlan: StructuredMealPlan
): Map<GroceryCategoryId, GroceryItem[]> {
  const merged = new Map<string, GroceryItem>();
  const portions = portionsFromPrepSchedule(mealPlan.meal_prep_schedule);

  for (const recipe of mealPlan.recipes) {
    const mult =
      portions.get(recipe.meal_name.trim().toLowerCase()) ??
      recipe.servings_per_week;
    for (const ing of recipe.ingredients_per_serving) {
      const key = normalizeIngredientKey(ing.name, ing.unit);
      const totalAmount = ing.amount * mult;
      const existing = merged.get(key);
      if (existing) {
        existing.amount += totalAmount;
      } else {
        merged.set(key, {
          name: ing.name,
          amount: totalAmount,
          unit: ing.unit,
          category: categorizeIngredient(ing.name),
        });
      }
    }
  }

  const byCategory = new Map<GroceryCategoryId, GroceryItem[]>();
  for (const cat of GROCERY_CATEGORIES) {
    byCategory.set(cat.id, []);
  }
  Array.from(merged.values()).forEach((item) => {
    byCategory.get(item.category)!.push(item);
  });
  byCategory.forEach((items) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
  });
  return byCategory;
}

export function formatGroceryItem(item: GroceryItem): string {
  const qty = formatAmount(item.amount, item.unit);
  const suffix =
    item.unit === "whole" || item.unit === "unit"
      ? ` — ${qty}`
      : ` — ${qty}`;
  return `${item.name.charAt(0).toUpperCase() + item.name.slice(1)}${suffix}`;
}

export function groceryListAsPlainText(
  byCategory: Map<GroceryCategoryId, GroceryItem[]>
): string {
  const lines: string[] = ["Weekly Grocery List", ""];
  for (const cat of GROCERY_CATEGORIES) {
    const items = byCategory.get(cat.id) ?? [];
    if (items.length === 0) continue;
    lines.push(`${cat.emoji} ${cat.label}`);
    for (const item of items) {
      lines.push(`  • ${formatGroceryItem(item)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function scaledIngredientsForRecipe(recipe: MealRecipe): MealIngredient[] {
  const mult = recipe.servings_per_week;
  return recipe.ingredients_per_serving.map((ing) => ({
    name: ing.name,
    amount: Math.round(ing.amount * mult * 10) / 10,
    unit: ing.unit,
  }));
}

export function formatScaledIngredient(ing: MealIngredient): string {
  const qty = formatAmount(ing.amount, ing.unit);
  if (ing.unit === "whole" || ing.unit === "unit") {
    return `${Math.round(ing.amount)} ${ing.name}${ing.amount > 1 ? "s" : ""}`;
  }
  return `${qty} ${ing.name}`;
}

export function findRecipeByName(
  recipes: MealRecipe[],
  mealName: string
): MealRecipe | undefined {
  const key = mealName.trim().toLowerCase();
  return recipes.find((r) => r.meal_name.trim().toLowerCase() === key);
}

