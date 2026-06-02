import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import { getFastingRecommendation } from "@/lib/program/bmi";
import {
  calculateProgramWeeks,
  needsMaintenanceBlock,
  weightToLoseKg,
} from "@/lib/program/duration";
import { cookFrequencyGuidance } from "@/lib/program/cookFrequency";
import type { ProgramCalculation } from "@/lib/program/calorieTargets";

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
  assessment: NonNullable<OnboardingFormData["assessment"]>,
  calculation: ProgramCalculation
): string {
  const weight = parseFloat(data.currentWeightKg);
  const height = parseFloat(data.heightCm);
  const weeklyRate = parseFloat(data.weeklyLossRateKg || "0.6");
  const toLose = weightToLoseKg(weight, assessment.goal_weight_kg);
  const programWeeks = calculateProgramWeeks(toLose, weeklyRate);
  const fasting = getFastingRecommendation(weight, height);
  const maintenance = needsMaintenanceBlock(toLose);
  const blockWeeks = maintenance ? 12 : programWeeks;
  const beginnerRamp =
    data.exerciseFrequency === "Never" || data.exerciseFrequency === "Rarely";

  return `You are LifeBody AI's program designer. Create a personalized ${programWeeks}-week lifestyle program.

USER STATS:
- Weight: ${weight} kg → Goal: ${assessment.goal_weight_kg} kg (lose ~${toLose.toFixed(1)} kg)
- Height: ${height} cm, Age: ${data.age}, Sex: ${sexLabel(data.sex)}
- Goal body: ${goalBodyLabel(data.goalBodyType)}
- Body description: ${data.currentBodyDescription}
- Phase: ${assessment.phase}
- Chosen pace: ${weeklyRate} kg/week

LIFESTYLE:
- Cuisines loved: ${data.cuisines}
- Sweets: ${data.sweetsFrequency}
- Sports/movement enjoyed: ${data.sportsEnjoyed}
- Exercise frequency: ${data.exerciseFrequency}
- Cooking: ${data.cookFrequency}
- Meals/day: ${data.mealsPerDay}
- Eating schedule: ${data.eatingSchedule}
- Snacks: ${data.snacks}
- Recent eating: ${data.recentEating}
- Restrictions: ${data.dietaryRestrictions || "None"}

RULES (must follow):
- Program length: exactly ${programWeeks} weeks
- Use EXACTLY these pre-calculated nutrition targets (do not change):
  - final_calories: ${calculation.final_calories}
  - final_protein_g: ${calculation.final_protein_g}
  - actual_weekly_loss_kg: ${calculation.actual_weekly_loss_kg}
- Weekly fat loss in output must be actual_weekly_loss_kg above (not user requested pace when floor is applied)
- Fasting (BMI rule): ${fasting.window}
- fasting_is_intermittent: ${fasting.isIntermittentFasting}
- Do NOT mention 16:8 or intermittent fasting if fasting_is_intermittent is false
${maintenance ? `- User loses >8kg total. maintenance_break after week ${blockWeeks}, then 4-8 week maintenance before next block` : "- maintenance_break: null"}

MEAL PLAN (meal prep): ${cookFrequencyGuidance(data.cookFrequency)}. Set A Mon-Wed, Set B Thu-Sun. Max 4 unique recipes for 2-3x/week cooks.

WORKOUTS: ${data.exerciseFrequency}. Full gym unless restricted.
${beginnerRamp ? '- Beginner progression is mandatory: 1 gym session/week for weeks 1-2, then 2 sessions/week from week 3 onward, and include this exact note in exercise_plan.overview: "Since you\'re new to working out, we\'re starting slow so you actually stick with it. One session in week 1-2, then we add a second session from week 3."' : ""}

Return ONLY valid JSON:
{
  "program_length_weeks": ${programWeeks},
  "calorie_target": ${calculation.final_calories},
  "protein_target_g": ${calculation.final_protein_g},
  "fasting_window": string,
  "fasting_is_intermittent": boolean,
  "weekly_fat_loss_kg": ${calculation.actual_weekly_loss_kg},
  "calculation": {
    "bmr": ${calculation.bmr},
    "tdee": ${calculation.tdee},
    "target_deficit": ${calculation.target_deficit},
    "calculated_calories": ${calculation.calculated_calories},
    "floor_applied": ${calculation.floor_applied},
    "final_calories": ${calculation.final_calories},
    "final_protein_g": ${calculation.final_protein_g},
    "actual_weekly_loss_kg": ${calculation.actual_weekly_loss_kg}
  },
  "phase_label": string,
  "maintenance_note": string or null,
  "meal_structure": { "overview": string, "daily_template": string },
  "exercise_plan": { "overview": string, "weekly_schedule": string },
  "block_summary": string,
  "week_highlights": string[],
  "meal_plan": {
    "meal_sets": {
      "set_a": { "days": ["Monday","Tuesday","Wednesday"], "breakfast": "Dish", "lunch": "Dish", "dinner": "Dish", "snack_budget_kcal": 200, "snack_suggestions": [] },
      "set_b": { "days": ["Thursday","Friday","Saturday","Sunday"], "breakfast": "Dish", "lunch": "Dish", "dinner": "Dish", "snack_budget_kcal": 200, "snack_suggestions": [] }
    },
    "recipes": [ max 4 unique dishes with full macros and ingredients ],
    "meal_prep_schedule": { "session_1": { "prep_day", "dishes_to_prep", "portions_to_make" }, "session_2": { ... } }
  },
  "fitness_plan": {
    "sessions_per_week": number,
    "sessions": [
      {
        "session_name": string,
        "focus": string,
        "suggested_days": string,
        "estimated_duration_minutes": number,
        "exercises": [
          { "name": string, "muscle_group": string, "sets": number, "reps": number, "rest_seconds": number, "coaching_tip": string }
        ]
      }
    ]
  },
  "mindset_notes": string[],
  "week_milestones": [{ "week": 1..${programWeeks}, "expected_weight_kg", "focus" }],
  "maintenance_break": ${maintenance ? `{ "show": true, "start_after_week": ${blockWeeks}, "duration_label": "4-8 weeks" }` : "null"}
}`;
}
