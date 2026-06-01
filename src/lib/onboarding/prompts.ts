import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";

function goalBodyLabel(id: string) {
  return GOAL_BODY_OPTIONS.find((g) => g.id === id)?.title ?? id;
}

function sexLabel(sex: string) {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Prefer not to say";
}

export function buildAssessmentPrompt(data: OnboardingFormData): string {
  const weight = parseFloat(data.currentWeightKg);
  const height = parseFloat(data.heightCm);
  const bmi = weight / Math.pow(height / 100, 2);

  return `You are a body composition coach for LifeBody AI. Analyze this user profile and respond with ONLY valid JSON (no markdown).

User data:
- Current weight: ${data.currentWeightKg} kg
- Height: ${data.heightCm} cm
- Age: ${data.age}
- Sex: ${sexLabel(data.sex)}
- BMI: ${bmi.toFixed(1)}
- Goal body type: ${goalBodyLabel(data.goalBodyType)}
- Current body description: ${data.currentBodyDescription}

Return JSON exactly matching this schema:
{
  "estimated_body_fat_pct": number (realistic estimate 8-45),
  "goal_weight_kg": number (realistic target for their goal body type),
  "phase": "fat loss" | "muscle gain" | "recomposition",
  "summary": "2-3 sentence honest, encouraging assessment",
  "motivational_close": "Are you ready to start?"
}`;
}

export function buildProgramPrompt(
  data: OnboardingFormData,
  assessment: NonNullable<OnboardingFormData["assessment"]>
): string {
  const weight = parseFloat(data.currentWeightKg);
  const height = parseFloat(data.heightCm);
  const bmi = weight / Math.pow(height / 100, 2);
  const weightToLose = weight - assessment.goal_weight_kg;
  const proteinMin = Math.max(90, Math.round(weight * 1.8));
  const needsMaintenanceNote = weightToLose > 8;

  return `You are LifeBody AI's program designer. Create a personalized 12-week lifestyle program.

USER STATS:
- Weight: ${weight} kg → Goal: ${assessment.goal_weight_kg} kg (${weightToLose > 0 ? `lose ~${weightToLose.toFixed(1)} kg` : "maintain/build"})
- Height: ${height} cm, Age: ${data.age}, Sex: ${sexLabel(data.sex)}
- BMI: ${bmi.toFixed(1)}
- Goal body: ${goalBodyLabel(data.goalBodyType)}
- Body description: ${data.currentBodyDescription}
- Phase: ${assessment.phase}
- Estimated body fat: ${assessment.estimated_body_fat_pct}%

LIFESTYLE:
- Cuisines loved: ${data.cuisines}
- Sweets frequency: ${data.sweetsFrequency}
- Sports/movement enjoyed: ${data.sportsEnjoyed}
- Exercise frequency: ${data.exerciseFrequency}
- Cooking frequency: ${data.cookFrequency}
- Meals per day: ${data.mealsPerDay}
- Eating schedule: ${data.eatingSchedule}
- Snacks: ${data.snacks}
- Recent eating: ${data.recentEating}
- Restrictions/health: ${data.dietaryRestrictions || "None noted"}

RULES (must follow):
- Target 0.5–0.7 kg fat loss per week over 12 weeks
- 12-week block duration
- Calorie target: never below 1450 kcal/day
- Protein target: bodyweight kg × 1.8, minimum ${proteinMin}g/day
- ${bmi > 25 ? "Recommend 16:8 intermittent fasting" : "Recommend minimum 12–13 hours fasting window daily"}
${needsMaintenanceNote ? `- IMPORTANT: User needs to lose more than 8kg. Include maintenance_note explaining a 4–8 week maintenance break is recommended after this 12-week block before the next block.` : "- maintenance_note should be null"}

Return ONLY valid JSON with this exact structure (all fields required):
{
  "calorie_target": number,
  "protein_target_g": number,
  "fasting_window": string,
  "weekly_fat_loss_kg": number,
  "phase_label": string,
  "maintenance_note": string or null,
  "meal_structure": { "overview": string, "daily_template": string },
  "exercise_plan": { "overview": string, "weekly_schedule": string },
  "block_summary": string,
  "week_highlights": string[],
  "weekly_meal_plan": {
    "monday": { "breakfast": meal, "lunch": meal, "dinner": meal, "snack": meal },
    "tuesday": { ...same },
    "wednesday": { ... }, "thursday": { ... }, "friday": { ... }, "saturday": { ... }, "sunday": { ... }
  },
  "grocery_list": string[] (combined unique ingredients for the week),
  "workout_days": [
    { "category": "upper", "title": "Upper Body Day", "exercises": [{ "name": string, "sets": string, "reps": string, "tip": string }] },
    { "category": "lower", "title": "Lower Body Day", "exercises": [...] },
    { "category": "other", "title": "Cardio / Recovery", "exercises": [...] }
  ],
  "mindset_notes": string[] (4-6 short encouraging reminders),
  "week_milestones": [{ "week": 1, "expected_weight_kg": number, "focus": string }, ... through week 12],
  "maintenance_break": ${needsMaintenanceNote ? '{ "show": true, "start_after_week": 12, "duration_label": "4-8 weeks" }' : "null"}
}

Where meal = {
  "name": string,
  "calories": number,
  "protein": number,
  "recipe": string (2-4 sentences),
  "ingredients": string[] (3-8 items with amounts)
}

Meals must reflect cuisines the user loves, respect restrictions, and sum close to daily calorie_target and protein_target_g per day.
Use varied, realistic meal names — not generic placeholders.`;
}
