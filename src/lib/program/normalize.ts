import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";
import type {
  DayMeals,
  FullProgram,
  ProgramMeal,
  WeekdayKey,
  WeeklyMealPlan,
  WorkoutDay,
  WeekMilestone,
} from "@/types/program";
import { WEEKDAYS } from "@/types/program";

function defaultMeal(
  name: string,
  calories: number,
  protein: number
): ProgramMeal {
  return {
    name,
    calories,
    protein,
    recipe: `Prepare ${name} to fit your calorie and protein targets. Season to taste with herbs and spices.`,
    ingredients: ["See meal prep notes in your program overview"],
  };
}

function defaultDay(
  calorieTarget: number,
  proteinTarget: number
): DayMeals {
  const c = Math.round(calorieTarget / 4);
  const p = Math.round((proteinTarget / 4) * 10) / 10;
  return {
    breakfast: defaultMeal("Protein breakfast bowl", c, p),
    lunch: defaultMeal("Balanced lunch plate", c, p),
    dinner: defaultMeal("Lean dinner", c, p),
    snack: defaultMeal("High-protein snack", c, p),
  };
}

function buildDefaultMealPlan(
  calorieTarget: number,
  proteinTarget: number
): WeeklyMealPlan {
  return WEEKDAYS.reduce((acc, day) => {
    acc[day] = defaultDay(calorieTarget, proteinTarget);
    return acc;
  }, {} as WeeklyMealPlan);
}

function buildDefaultWorkouts(program: GeneratedProgram): WorkoutDay[] {
  const schedule = program.exercise_plan?.weekly_schedule ?? "";
  return [
    {
      category: "upper",
      title: "Upper Body Day",
      exercises: [
        {
          name: "Push-ups or bench press",
          sets: "3",
          reps: "10–12",
          tip: "Control the lowering phase for 2–3 seconds.",
        },
        {
          name: "Dumbbell rows",
          sets: "3",
          reps: "10–12",
          tip: "Squeeze shoulder blades at the top.",
        },
        {
          name: "Shoulder press",
          sets: "3",
          reps: "10–12",
          tip: "Keep core braced; avoid arching your back.",
        },
      ],
    },
    {
      category: "lower",
      title: "Lower Body Day",
      exercises: [
        {
          name: "Squats or goblet squats",
          sets: "3",
          reps: "10–15",
          tip: "Knees track over toes; depth as mobility allows.",
        },
        {
          name: "Romanian deadlift",
          sets: "3",
          reps: "10–12",
          tip: "Hinge at hips; feel stretch in hamstrings.",
        },
        {
          name: "Walking lunges",
          sets: "3",
          reps: "12 each leg",
          tip: "Stay tall through the chest.",
        },
      ],
    },
    {
      category: "other",
      title: "Cardio & Recovery",
      exercises: [
        {
          name: "Brisk walk or light cardio",
          sets: "1",
          reps: "25–35 min",
          tip: schedule || "Pick movement you enjoy — consistency beats intensity.",
        },
        {
          name: "Mobility / yoga flow",
          sets: "1",
          reps: "15–20 min",
          tip: "Focus on hips, shoulders, and spine.",
        },
      ],
    },
  ];
}

function buildMilestones(
  startWeight: number,
  goalWeight: number,
  weeklyLoss: number
): WeekMilestone[] {
  return Array.from({ length: 12 }, (_, i) => {
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
    cuisines?: string;
  }
): FullProgram {
  const plan = raw.weekly_meal_plan as WeeklyMealPlan | undefined;
  const hasPlan =
    plan &&
    WEEKDAYS.every(
      (d) =>
        plan[d]?.breakfast?.name &&
        plan[d]?.lunch?.name &&
        plan[d]?.dinner?.name &&
        plan[d]?.snack?.name
    );

  const weekly_meal_plan = hasPlan
    ? plan!
    : buildDefaultMealPlan(raw.calorie_target, raw.protein_target_g);

  const grocery_list =
    Array.isArray(raw.grocery_list) && raw.grocery_list.length > 0
      ? raw.grocery_list
      : collectGroceryFromPlan(weekly_meal_plan);

  const workout_days =
    Array.isArray(raw.workout_days) && raw.workout_days.length > 0
      ? (raw.workout_days as WorkoutDay[])
      : buildDefaultWorkouts(raw);

  const mindset_notes =
    Array.isArray(raw.mindset_notes) && raw.mindset_notes.length > 0
      ? raw.mindset_notes
      : [
          raw.block_summary,
          ...(raw.week_highlights ?? []).slice(0, 3),
        ].filter(Boolean);

  const week_milestones =
    Array.isArray(raw.week_milestones) && raw.week_milestones.length >= 12
      ? (raw.week_milestones as WeekMilestone[])
      : buildMilestones(
          ctx.currentWeightKg,
          ctx.goalWeightKg,
          raw.weekly_fat_loss_kg ?? 0.6
        );

  let maintenance_break = raw.maintenance_break ?? null;
  if (!maintenance_break && raw.maintenance_note) {
    maintenance_break = {
      show: true,
      start_after_week: 12,
      duration_label: "4–8 weeks",
    };
  }

  return {
    ...raw,
    weekly_meal_plan,
    grocery_list,
    workout_days,
    mindset_notes,
    week_milestones,
    maintenance_break,
  };
}

export function collectGroceryFromPlan(plan: WeeklyMealPlan): string[] {
  const set = new Set<string>();
  for (const day of WEEKDAYS) {
    for (const slot of ["breakfast", "lunch", "dinner", "snack"] as const) {
      const meal = plan[day][slot];
      meal.ingredients?.forEach((ing) => {
        const trimmed = ing.trim();
        if (trimmed) set.add(trimmed);
      });
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function goalBodyLabel(id: string): string {
  return GOAL_BODY_OPTIONS.find((g) => g.id === id)?.title ?? id;
}
