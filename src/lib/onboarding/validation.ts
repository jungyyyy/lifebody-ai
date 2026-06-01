import type { OnboardingFormData } from "@/types/onboarding";

export function validateStep(
  step: number,
  data: OnboardingFormData
): string | null {
  switch (step) {
    case 1: {
      const weight = parseFloat(data.currentWeightKg);
      const height = parseFloat(data.heightCm);
      const age = parseInt(data.age, 10);
      if (!weight || weight < 30 || weight > 300) {
        return "Enter a valid weight (30–300 kg)";
      }
      if (!height || height < 100 || height > 250) {
        return "Enter a valid height (100–250 cm)";
      }
      if (!age || age < 13 || age > 120) {
        return "Enter a valid age (13–120)";
      }
      if (!data.sex) return "Please select your sex";
      return null;
    }
    case 2:
      if (!data.goalBodyType) return "Please select a goal body type";
      return null;
    case 3:
      if (data.currentBodyDescription.trim().length < 10) {
        return "Please describe your current body (at least 10 characters)";
      }
      return null;
    case 5: {
      if (!data.cuisines.trim()) return "Please tell us what cuisines you love";
      if (!data.sweetsFrequency) return "Please select how often you eat sweets";
      if (!data.sportsEnjoyed.trim()) {
        return "Please share sports or movement you enjoy (or type None)";
      }
      if (!data.exerciseFrequency) {
        return "Please select your current exercise frequency";
      }
      if (!data.cookFrequency) return "Please select how often you can cook";
      if (!data.mealsPerDay) return "Please select meals per day";
      if (!data.eatingSchedule.trim()) {
        return "Please describe when you usually eat";
      }
      if (!data.snacks.trim()) return "Please describe your usual snacks";
      if (!data.recentEating.trim()) {
        return "Please describe what you've been eating recently";
      }
      return null;
    }
    default:
      return null;
  }
}
