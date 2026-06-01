import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import { getFastingRecommendation } from "@/lib/program/bmi";
import {
  calculateProgramWeeks,
  needsMaintenanceBlock,
  weightToLoseKg,
} from "@/lib/program/duration";
import { cookFrequencyGuidance } from "@/lib/program/cookFrequency";

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
  const weeklyRate = parseFloat(data.weeklyLossRateKg || "0.6");
  const toLose = weightToLoseKg(weight, assessment.goal_weight_kg);
  const programWeeks = calculateProgramWeeks(toLose, weeklyRate);
  const proteinMin = Math.max(90, Math.round(weight * 1.8));
  const fasting = getFastingRecommendation(weight, height);
  const maintenance = needsMaintenanceBlock(toLose);
  const blockWeeks = maintenance ? 12 : programWeeks;

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
- Weekly fat loss target: ${weeklyRate} kg/week
- Calorie target: never below 1450 kcal/day
- Protein: bodyweight × 1.8, minimum ${proteinMin}g/day
- Fasting (BMI rule): ${fasting.window}
- fasting_is_intermittent: ${fasting.isIntermittentFasting}
- Do NOT mention 16:8 or intermittent fasting if fasting_is_intermittent is false
${maintenance ? `- User loses >8kg total. maintenance_break after week ${blockWeeks}, then 4-8 week maintenance before next block` : "- maintenance_break: null"}

MEAL PLAN (meal prep): ${cookFrequencyGuidance(data.cookFrequency)}. Set A Mon-Wed, Set B Thu-Sun. Max 4 unique recipes for 2-3x/week cooks.

WORKOUTS: ${data.exerciseFrequency}. Full gym unless restricted.

Return ONLY valid JSON:
{
  "program_length_weeks": ${programWeeks},
  "calorie_target": number,
  "protein_target_g": number,
  "fasting_window": string,
  "fasting_is_intermittent": boolean,
  "weekly_fat_loss_kg": ${weeklyRate},
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
