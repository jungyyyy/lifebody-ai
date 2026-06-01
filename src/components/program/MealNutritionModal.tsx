"use client";

import type { MealRecipe } from "@/types/program";

export function MealNutritionModal({
  recipe,
  onClose,
}: {
  recipe: MealRecipe | null;
  onClose: () => void;
}) {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-xl font-semibold text-white">{recipe.meal_name}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <Nutrient label="Calories" value={`${recipe.calories_per_serving} kcal`} />
          <Nutrient label="Protein" value={`${recipe.protein_per_serving} g`} />
          <Nutrient label="Carbs" value={`${recipe.carbs_per_serving} g`} />
          <Nutrient label="Fat" value={`${recipe.fat_per_serving} g`} />
          <Nutrient label="Fiber" value={`${recipe.fiber_per_serving} g`} />
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-black"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Nutrient({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background border border-white/10 px-3 py-2.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-white mt-0.5 tabular-nums">{value}</dd>
    </div>
  );
}
