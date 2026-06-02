import type { GoalBodyType } from "@/types/onboarding";

export const GOAL_BODY_IDS: GoalBodyType[] = [
  "lean_athletic",
  "slim_strong",
  "healthy_light",
  "muscular_powerful",
];

export const GOAL_BODY_EMOJI: Record<GoalBodyType, string> = {
  lean_athletic: "🏃",
  slim_strong: "💪",
  healthy_light: "🌿",
  muscular_powerful: "🦁",
};

export function goalBodyTranslationKey(id: GoalBodyType): string {
  const map: Record<GoalBodyType, string> = {
    lean_athletic: "goalLeanAthletic",
    slim_strong: "goalSlimStrong",
    healthy_light: "goalHealthyLight",
    muscular_powerful: "goalMuscularPowerful",
  };
  return map[id];
}

export function goalBodyDescTranslationKey(id: GoalBodyType): string {
  const map: Record<GoalBodyType, string> = {
    lean_athletic: "goalLeanAthleticDesc",
    slim_strong: "goalSlimStrongDesc",
    healthy_light: "goalHealthyLightDesc",
    muscular_powerful: "goalMuscularPowerfulDesc",
  };
  return map[id];
}
