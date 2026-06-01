export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DAY_DISPLAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayDisplayName = (typeof DAY_DISPLAY_NAMES)[number];

export const DISPLAY_NAME_TO_KEY: Record<DayDisplayName, WeekdayKey> = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
  Sunday: "sunday",
};

export const KEY_TO_DISPLAY_NAME: Record<WeekdayKey, DayDisplayName> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** @deprecated Legacy meal shape */
export interface ProgramMeal {
  name: string;
  calories: number;
  protein: number;
  recipe: string;
  ingredients: string[];
  recipe_steps?: string[];
}

export type DayMeals = {
  breakfast: ProgramMeal;
  lunch: ProgramMeal;
  dinner: ProgramMeal;
  snack: ProgramMeal;
};

export type WeeklyMealPlan = Record<WeekdayKey, DayMeals>;

export type MealSlot = keyof DayMeals;

export const MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export interface MealIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealRecipe {
  meal_name: string;
  servings_per_week: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving: number;
  ingredients_per_serving: MealIngredient[];
  steps: string[];
}

export interface MealPlanDay {
  day: DayDisplayName;
  meals: Record<MealSlot, string>;
}

export interface MealPrepSet {
  days: DayDisplayName[];
  breakfast: string;
  lunch: string;
  dinner: string;
  snack_budget_kcal: number;
  snack_suggestions: string[];
}

export interface MealPrepSession {
  prep_day: string;
  dishes_to_prep: string[];
  portions_to_make: Record<string, number>;
}

export interface MealPrepSchedule {
  session_1: MealPrepSession;
  session_2: MealPrepSession;
}

export interface StructuredMealPlan {
  meal_sets: {
    set_a: MealPrepSet;
    set_b: MealPrepSet;
  };
  recipes: MealRecipe[];
  meal_prep_schedule: MealPrepSchedule;
  /** Populated from meal_sets for the weekly table UI */
  week?: MealPlanDay[];
}

export interface FitnessExercise {
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  coaching_tip: string;
}

export interface FitnessSession {
  session_name: string;
  focus: string;
  suggested_days: string;
  estimated_duration_minutes: number;
  exercises: FitnessExercise[];
}

export interface StructuredFitnessPlan {
  sessions_per_week: number;
  sessions: FitnessSession[];
}

/** @deprecated Legacy workout */
export interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
  tip: string;
}

export type WorkoutCategory =
  | "upper"
  | "lower"
  | "full_body"
  | "cardio"
  | "flexibility"
  | "other";

export interface WorkoutDay {
  category: WorkoutCategory;
  title: string;
  day_label?: string;
  exercises: WorkoutExercise[];
}

export interface WeekMilestone {
  week: number;
  expected_weight_kg: number;
  focus: string;
}

export interface MaintenanceBreak {
  show: boolean;
  start_after_week: number;
  duration_label: string;
}

export interface GeneratedProgram {
  program_length_weeks: number;
  calorie_target: number;
  protein_target_g: number;
  fasting_window: string;
  fasting_is_intermittent?: boolean;
  weekly_fat_loss_kg: number;
  phase_label: string;
  maintenance_note: string | null;
  meal_structure: {
    overview: string;
    daily_template: string;
  };
  exercise_plan: {
    overview: string;
    weekly_schedule: string;
  };
  block_summary: string;
  week_highlights: string[];
  meal_plan?: StructuredMealPlan;
  fitness_plan?: StructuredFitnessPlan;
  weekly_meal_plan?: WeeklyMealPlan;
  grocery_list?: string[];
  workout_days?: WorkoutDay[];
  mindset_notes?: string[];
  week_milestones?: WeekMilestone[];
  maintenance_break?: MaintenanceBreak | null;
}

export interface FullProgram extends GeneratedProgram {
  meal_plan: StructuredMealPlan;
  fitness_plan: StructuredFitnessPlan;
  mindset_notes: string[];
  week_milestones: WeekMilestone[];
  maintenance_break: MaintenanceBreak | null;
}

export interface ProgramPageData {
  currentWeightKg: number;
  goalWeightKg: number;
  goalBodyLabel: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  program: FullProgram;
}
