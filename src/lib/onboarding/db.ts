import type { OnboardingFormData } from "@/types/onboarding";
import type { SupabaseClient } from "@supabase/supabase-js";

export function formDataToRow(data: OnboardingFormData) {
  return {
    current_weight_kg: parseFloat(data.currentWeightKg),
    height_cm: parseFloat(data.heightCm),
    age: parseInt(data.age, 10),
    sex: data.sex,
    goal_body_type: data.goalBodyType,
    current_body_description: data.currentBodyDescription.trim(),
    body_assessment: data.assessment,
    cuisines: data.cuisines.trim(),
    sweets_frequency: data.sweetsFrequency,
    sports_enjoyed: data.sportsEnjoyed.trim(),
    exercise_frequency: data.exerciseFrequency,
    cook_frequency: data.cookFrequency,
    meals_per_day: data.mealsPerDay,
    eating_schedule: data.eatingSchedule.trim(),
    snacks: data.snacks.trim(),
    recent_eating: data.recentEating.trim(),
    dietary_restrictions: data.dietaryRestrictions.trim() || null,
  };
}

export async function upsertOnboardingData(
  supabase: SupabaseClient,
  userId: string,
  data: OnboardingFormData
) {
  return supabase.from("onboarding_data").upsert(
    {
      user_id: userId,
      ...formDataToRow(data),
    },
    { onConflict: "user_id" }
  );
}
