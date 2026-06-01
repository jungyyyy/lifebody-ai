"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { MealNutritionModal } from "@/components/program/MealNutritionModal";
import type { FullProgram, MealRecipe, MealSlot } from "@/types/program";
import {
  MEAL_SLOT_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "@/types/program";
import {
  buildConsolidatedGroceryList,
  findRecipeByName,
  formatScaledIngredient,
  groceryListAsPlainText,
  formatGroceryItem,
} from "@/lib/program/grocery";
import { GROCERY_CATEGORIES } from "@/lib/program/grocery";
import {
  isCookableMealName,
  mealNameForSlot,
  portionsForRecipe,
  scaledIngredientsForPortions,
} from "@/lib/program/mealPlanTransform";
import { hasValidMealPlan } from "@/lib/program/validatePlans";
import type { MealPrepSession } from "@/types/program";

const TABLE_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function PrepSessionCard({
  title,
  session,
}: {
  title: string;
  session: MealPrepSession;
}) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <p className="text-sm font-medium text-amber-200">{title}</p>
      <p className="text-xs text-gray-400 mt-1">Prep on: {session.prep_day}</p>
      <p className="text-sm text-white mt-3">Cook:</p>
      <ul className="mt-1 space-y-0.5">
        {session.dishes_to_prep.map((d) => (
          <li key={d} className="text-sm text-gray-300">
            • {d}
          </li>
        ))}
      </ul>
      <p className="text-sm text-white mt-3">Portions to make:</p>
      <ul className="mt-1 space-y-0.5">
        {Object.entries(session.portions_to_make).map(([dish, count]) => (
          <li key={dish} className="text-sm text-gray-300 tabular-nums">
            {dish} — <span className="text-accent">{count} portions</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MealPlanTab({
  program,
  onProgramUpdate,
}: {
  program: FullProgram;
  onProgramUpdate: (p: FullProgram) => void;
}) {
  const [loading, setLoading] = useState(
    !hasValidMealPlan(program.meal_plan)
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<MealRecipe | null>(null);
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);

  const mealPlan = program.meal_plan;

  const ensureMealPlan = useCallback(async () => {
    if (hasValidMealPlan(mealPlan)) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/program/ensure-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: "meal" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load meal plan");
      onProgramUpdate(json.program);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  }, [mealPlan, onProgramUpdate]);

  useEffect(() => {
    if (!hasValidMealPlan(mealPlan)) {
      ensureMealPlan();
    }
  }, [mealPlan, ensureMealPlan]);

  const recipes = useMemo(
    () =>
      [...mealPlan.recipes].sort((a, b) =>
        a.meal_name.localeCompare(b.meal_name)
      ),
    [mealPlan.recipes]
  );

  const groceryByCategory = useMemo(
    () => buildConsolidatedGroceryList(mealPlan),
    [mealPlan]
  );

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustText.trim()) return;
    setAdjustLoading(true);
    setAdjustMsg(null);
    const res = await fetch("/api/program/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: adjustText }),
    });
    const json = await res.json();
    setAdjustLoading(false);
    if (!res.ok) {
      setAdjustMsg(json.error ?? "Update failed");
      return;
    }
    onProgramUpdate(json.program);
    setAdjustMsg(json.message);
    setAdjustText("");
    setAdjustOpen(false);
  }

  function openMeal(cellText: string) {
    if (!isCookableMealName(cellText)) return;
    const recipe = findRecipeByName(mealPlan.recipes, cellText);
    if (recipe) setSelectedRecipe(recipe);
  }

  async function copyGroceryList() {
    const text = groceryListAsPlainText(groceryByCategory);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 animate-pulse">
          Building your meal prep plan…
        </p>
        <p className="text-xs text-gray-500 mt-2">2 sets · max 4 recipes</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-red-400 text-sm">{loadError}</p>
        <button
          type="button"
          onClick={ensureMealPlan}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  const { session_1, session_2 } = mealPlan.meal_prep_schedule;

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-400 leading-relaxed">
        Same meals repeat Mon–Wed (Set A) and Thu–Sun (Set B). You only meal prep
        twice a week.
      </p>

      <section>
        <h3 className="text-sm font-medium text-white mb-3">Weekly meals</h3>
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 gap-1.5 text-xs">
              <div />
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center font-medium text-gray-400 py-1"
                >
                  {WEEKDAY_LABELS[d]}
                </div>
              ))}
              {TABLE_SLOTS.map((slot) => (
                <Fragment key={slot}>
                  <div className="text-gray-500 py-2 pr-2 text-right self-center">
                    {MEAL_SLOT_LABELS[slot]}
                  </div>
                  {WEEKDAYS.map((dayKey) => {
                    const cell = mealNameForSlot(mealPlan, dayKey, slot);
                    const clickable = isCookableMealName(cell);
                    return (
                      <button
                        key={`${dayKey}-${slot}`}
                        type="button"
                        onClick={() => openMeal(cell)}
                        disabled={!clickable}
                        className={`rounded-lg border p-2 text-left transition-colors ${
                          clickable
                            ? "border-white/10 bg-background hover:border-accent/40"
                            : "border-white/5 bg-background/50 cursor-default"
                        }`}
                      >
                        <p
                          className={`text-[11px] font-medium line-clamp-3 leading-tight ${
                            slot === "snack" ? "text-gray-400" : "text-white"
                          }`}
                        >
                          {cell || "—"}
                        </p>
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Mon–Wed share Set A · Thu–Sun share Set B · Snacks are flexible (~200
          kcal)
        </p>
      </section>

      <section>
        <h3 className="text-sm font-medium text-white mb-3">
          Your Meal Prep Plan 🍳
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <PrepSessionCard title="Prep session 1" session={session_1} />
          <PrepSessionCard title="Prep session 2" session={session_2} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-white mb-3">
          Recipes ({recipes.length})
        </h3>
        <div className="space-y-2">
          {recipes.map((recipe) => {
            const isOpen = openRecipe === recipe.meal_name;
            const totalPortions = portionsForRecipe(mealPlan, recipe);
            const scaled = scaledIngredientsForPortions(recipe, totalPortions);
            return (
              <div
                key={recipe.meal_name}
                className="rounded-xl border border-white/10 bg-background overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenRecipe(isOpen ? null : recipe.meal_name)
                  }
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-white">
                    {recipe.meal_name}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    × {totalPortions} this week
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-4">
                    <p className="text-sm text-gray-400">
                      This recipe makes{" "}
                      <span className="text-white font-medium">
                        {totalPortions} portion
                        {totalPortions > 1 ? "s" : ""}
                      </span>{" "}
                      for your meal prep batches this week.
                    </p>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Ingredients (batch total)
                      </p>
                      <ul className="space-y-1">
                        {scaled.map((ing, i) => (
                          <li key={i} className="text-sm text-gray-300">
                            {formatScaledIngredient(ing)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Instructions
                      </p>
                      <ol className="list-decimal list-inside space-y-2">
                        {recipe.steps.map((step, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-300 leading-relaxed"
                          >
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipe(recipe)}
                      className="text-xs text-accent hover:underline"
                    >
                      View nutrition per serving →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-medium text-white">Grocery list</h3>
          <button
            type="button"
            onClick={copyGroceryList}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:border-accent/40 hover:text-white"
          >
            {copied ? "Copied!" : "Copy grocery list"}
          </button>
        </div>
        <div className="space-y-4">
          {GROCERY_CATEGORIES.map((cat) => {
            const items = groceryByCategory.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat.id}>
                <p className="text-xs font-medium text-gray-400 mb-2">
                  {cat.emoji} {cat.label}
                </p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={`${item.name}-${item.unit}`}
                      className="text-sm text-gray-300 pl-1"
                    >
                      {formatGroceryItem(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <div className="border-t border-white/10 pt-6">
        {!adjustOpen ? (
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            className="w-full rounded-lg border border-dashed border-white/20 py-3 text-sm text-gray-300 hover:border-accent/40 hover:text-white transition-colors"
          >
            Something changed? Let me know
          </button>
        ) : (
          <form onSubmit={submitAdjust} className="space-y-3">
            <textarea
              value={adjustText}
              onChange={(e) => setAdjustText(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-sm text-white resize-none"
              placeholder="I'm going out for dinner on Thursday…"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adjustLoading}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-black disabled:opacity-50"
              >
                {adjustLoading ? "Updating…" : "Update my week"}
              </button>
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {adjustMsg && (
          <p className="mt-3 text-sm text-accent">{adjustMsg}</p>
        )}
      </div>

      <MealNutritionModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}
