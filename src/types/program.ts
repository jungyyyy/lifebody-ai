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

export interface ProgramMeal {
  name: string;
  calories: number;
  protein: number;
  recipe: string;
  ingredients: string[];
}

export type DayMeals = {
  breakfast: ProgramMeal;
  lunch: ProgramMeal;
  dinner: ProgramMeal;
  snack: ProgramMeal;
};

export type WeeklyMealPlan = Record<WeekdayKey, DayMeals>;

export type MealSlot = keyof DayMeals;

export interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
  tip: string;
}

export interface WorkoutDay {
  category: "upper" | "lower" | "other";
  title: string;
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
  calorie_target: number;
  protein_target_g: number;
  fasting_window: string;
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
  weekly_meal_plan?: WeeklyMealPlan;
  grocery_list?: string[];
  workout_days?: WorkoutDay[];
  mindset_notes?: string[];
  week_milestones?: WeekMilestone[];
  maintenance_break?: MaintenanceBreak | null;
}

export interface FullProgram extends GeneratedProgram {
  weekly_meal_plan: WeeklyMealPlan;
  grocery_list: string[];
  workout_days: WorkoutDay[];
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
