export type Sex = "male" | "female" | "prefer_not_to_say";

export type GoalBodyType =
  | "lean_athletic"
  | "slim_strong"
  | "healthy_light"
  | "muscular_powerful";

export const GOAL_BODY_OPTIONS: {
  id: GoalBodyType;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    id: "lean_athletic",
    emoji: "🏃",
    title: "Lean & Athletic",
    description: "Low body fat, visible muscle tone",
  },
  {
    id: "slim_strong",
    emoji: "💪",
    title: "Slim & Strong",
    description: "Slim with noticeable muscle, flat stomach",
  },
  {
    id: "healthy_light",
    emoji: "🌿",
    title: "Healthy & Light",
    description: "Lose fat, feel light and energetic",
  },
  {
    id: "muscular_powerful",
    emoji: "🦁",
    title: "Muscular & Powerful",
    description: "Gain significant muscle mass",
  },
];

export interface BodyAssessment {
  estimated_body_fat_pct: number;
  goal_weight_kg: number;
  phase: "fat loss" | "muscle gain" | "recomposition";
  summary: string;
  motivational_close: string;
}

export type { GeneratedProgram } from "@/types/program";

export interface OnboardingFormData {
  nickname: string;
  weeklyLossRateKg: WeeklyLossRate | "";
  currentWeightKg: string;
  heightCm: string;
  age: string;
  sex: Sex | "";
  goalBodyType: GoalBodyType | "";
  currentBodyDescription: string;
  assessment: BodyAssessment | null;
  cuisines: string;
  sweetsFrequency: string;
  sportsEnjoyed: string;
  exerciseFrequency: string;
  cookFrequency: string;
  mealsPerDay: string;
  eatingSchedule: string;
  snacks: string;
  recentEating: string;
  dietaryRestrictions: string;
}

export const INITIAL_ONBOARDING_DATA: OnboardingFormData = {
  nickname: "",
  weeklyLossRateKg: "",
  currentWeightKg: "",
  heightCm: "",
  age: "",
  sex: "",
  goalBodyType: "",
  currentBodyDescription: "",
  assessment: null,
  cuisines: "",
  sweetsFrequency: "",
  sportsEnjoyed: "",
  exerciseFrequency: "",
  cookFrequency: "",
  mealsPerDay: "",
  eatingSchedule: "",
  snacks: "",
  recentEating: "",
  dietaryRestrictions: "",
};

export type WeeklyLossRate = "0.5" | "0.6" | "0.7";

export const TOTAL_ONBOARDING_STEPS = 8;

export const SWEETS_OPTIONS = [
  "Daily",
  "A few times a week",
  "Rarely",
  "Almost never",
] as const;

export const EXERCISE_OPTIONS = [
  "Daily",
  "3-5x/week",
  "1-2x/week",
  "Rarely",
  "Never",
] as const;

export const COOK_OPTIONS = [
  "Every day",
  "4-6x",
  "2-3x",
  "Once",
  "Rarely/Never",
] as const;

export const MEALS_OPTIONS = ["1", "2", "3", "4+"] as const;
