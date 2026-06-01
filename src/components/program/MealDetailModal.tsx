"use client";

import type { ProgramMeal } from "@/types/program";

export function MealDetailModal({
  meal,
  dayLabel,
  slotLabel,
  onClose,
}: {
  meal: ProgramMeal | null;
  dayLabel: string;
  slotLabel: string;
  onClose: () => void;
}) {
  if (!meal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-card p-6">
        <p className="text-xs text-accent uppercase tracking-wide">
          {dayLabel} · {slotLabel}
        </p>
        <h2 className="text-xl font-semibold text-white mt-1">{meal.name}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {Math.round(meal.calories)} kcal · {meal.protein}g protein
        </p>

        <div className="mt-5">
          <h3 className="text-sm font-medium text-white">Recipe</h3>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">{meal.recipe}</p>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-medium text-white">Ingredients</h3>
          <ul className="mt-2 space-y-1.5">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-gray-400 flex gap-2">
                <span className="text-accent">•</span>
                {ing}
              </li>
            ))}
          </ul>
        </div>

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
