import type { OnboardingFormData } from "@/types/onboarding";

export type ValidationKey =
  | "nickname"
  | "weight"
  | "height"
  | "age"
  | "sex"
  | "goalBody"
  | "bodyDescription"
  | "lossRate"
  | "cuisines"
  | "sweets"
  | "sports"
  | "exercise"
  | "cook"
  | "meals"
  | "schedule"
  | "snacks"
  | "recentEating";

export function validateStep(
  step: number,
  data: OnboardingFormData
): ValidationKey | null {
  switch (step) {
    case 1: {
      if (!data.nickname.trim() || data.nickname.trim().length < 2) {
        return "nickname";
      }
      const weight = parseFloat(data.currentWeightKg);
      const height = parseFloat(data.heightCm);
      const age = parseInt(data.age, 10);
      if (!weight || weight < 30 || weight > 300) {
        return "weight";
      }
      if (!height || height < 100 || height > 250) {
        return "height";
      }
      if (!age || age < 13 || age > 120) {
        return "age";
      }
      if (!data.sex) return "sex";
      return null;
    }
    case 2:
      if (!data.goalBodyType) return "goalBody";
      return null;
    case 3:
      if (data.currentBodyDescription.trim().length < 10) {
        return "bodyDescription";
      }
      return null;
    case 5:
      if (!data.weeklyLossRateKg) {
        return "lossRate";
      }
      return null;
    case 6: {
      if (!data.cuisines.trim()) return "cuisines";
      if (!data.sweetsFrequency) return "sweets";
      if (!data.sportsEnjoyed.trim()) {
        return "sports";
      }
      if (!data.exerciseFrequency) {
        return "exercise";
      }
      if (!data.cookFrequency) return "cook";
      if (!data.mealsPerDay) return "meals";
      if (!data.eatingSchedule.trim()) {
        return "schedule";
      }
      if (!data.snacks.trim()) return "snacks";
      if (!data.recentEating.trim()) {
        return "recentEating";
      }
      return null;
    }
    default:
      return null;
  }
}
