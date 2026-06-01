import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";
import type {
  FullProgram,
  StructuredFitnessPlan,
  StructuredMealPlan,
  WeekMilestone,
} from "@/types/program";
import { normalizeMealPlanStructure } from "@/lib/program/mealPlanTransform";
import {
  hasValidFitnessPlan,
  hasValidMealPlan,
} from "@/lib/program/validatePlans";

function emptyMealPlan(): StructuredMealPlan {
  return {
    meal_sets: {
      set_a: {
        days: ["Monday", "Tuesday", "Wednesday"],
        breakfast: "",
        lunch: "",
        dinner: "",
        snack_budget_kcal: 200,
        snack_suggestions: [],
      },
      set_b: {
        days: ["Thursday", "Friday", "Saturday", "Sunday"],
        breakfast: "",
        lunch: "",
        dinner: "",
        snack_budget_kcal: 200,
        snack_suggestions: [],
      },
    },
    recipes: [],
    meal_prep_schedule: {
      session_1: { prep_day: "", dishes_to_prep: [], portions_to_make: {} },
      session_2: { prep_day: "", dishes_to_prep: [], portions_to_make: {} },
    },
  };
}

function emptyFitnessPlan(): StructuredFitnessPlan {
  return { sessions_per_week: 0, sessions: [] };
}

function buildMilestones(
  startWeight: number,
  goalWeight: number,
  weeklyLoss: number,
  totalWeeks: number
): WeekMilestone[] {
  return Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    const expected = Math.max(
      goalWeight,
      Math.round((startWeight - weeklyLoss * week) * 10) / 10
    );
    return {
      week,
      expected_weight_kg: expected,
      focus:
        week <= 4
          ? "Build habits & consistency"
          : week <= 8
            ? "Steady fat loss & strength"
            : "Finish strong & prepare maintenance",
    };
  });
}

export function normalizeProgram(
  raw: GeneratedProgram,
  ctx: {
    currentWeightKg: number;
    goalWeightKg: number;
    cookFrequency?: string;
  }
): FullProgram {
  const programWeeks = raw.program_length_weeks ?? 12;
  const cookFreq = ctx.cookFrequency ?? "2-3x";

  let meal_plan: StructuredMealPlan;
  if (hasValidMealPlan(raw.meal_plan, cookFreq)) {
    meal_plan = normalizeMealPlanStructure(raw.meal_plan!, cookFreq);
  } else {
    meal_plan = emptyMealPlan();
  }

  const fitness_plan = hasValidFitnessPlan(raw.fitness_plan)
    ? raw.fitness_plan!
    : emptyFitnessPlan();

  const mindset_notes =
    Array.isArray(raw.mindset_notes) && raw.mindset_notes.length > 0
      ? raw.mindset_notes
      : [
          raw.block_summary,
          ...(raw.week_highlights ?? []).slice(0, 3),
        ].filter(Boolean);

  const week_milestones =
    Array.isArray(raw.week_milestones) &&
    raw.week_milestones.length >= programWeeks
      ? raw.week_milestones
      : buildMilestones(
          ctx.currentWeightKg,
          ctx.goalWeightKg,
          raw.weekly_fat_loss_kg ?? 0.6,
          programWeeks
        );

  let maintenance_break = raw.maintenance_break ?? null;
  if (!maintenance_break && raw.maintenance_note) {
    maintenance_break = {
      show: true,
      start_after_week: Math.min(12, programWeeks),
      duration_label: "4–8 weeks",
    };
  }

  return {
    ...raw,
    program_length_weeks: programWeeks,
    meal_plan,
    fitness_plan,
    mindset_notes,
    week_milestones,
    maintenance_break,
  };
}

export function goalBodyLabel(id: string): string {
  return GOAL_BODY_OPTIONS.find((g) => g.id === id)?.title ?? id;
}
