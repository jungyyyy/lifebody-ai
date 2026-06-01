import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";
import {
  cookFrequencyGuidance,
  maxUniqueRecipesForCookFrequency,
} from "@/lib/program/cookFrequency";

function goalBodyLabel(id: string) {
  return GOAL_BODY_OPTIONS.find((g) => g.id === id)?.title ?? id;
}

export function sessionsPerWeekFromFrequency(freq: string): number {
  if (/daily/i.test(freq)) return 5;
  if (/3-5|3–5/i.test(freq)) return 4;
  if (/1-2|1–2/i.test(freq)) return 2;
  if (/rarely|never/i.test(freq)) return 2;
  return 3;
}

export function buildMealPlanRegeneratePrompt(
  data: OnboardingFormData,
  targets: { calorie_target: number; protein_target_g: number }
): string {
  const maxRecipes = maxUniqueRecipesForCookFrequency(data.cookFrequency);
  const cookGuide = cookFrequencyGuidance(data.cookFrequency);

  return `You are LifeBody AI's meal prep planner. The user does NOT cook a different meal every day.

${cookGuide}

MEAL PREP PHILOSOPHY (MANDATORY):
- Maximum 2 different breakfasts per week (Set A vs Set B)
- Maximum 2 different lunches per week
- Maximum 2 different dinners per week
- Lunch and dinner CAN be the same dish within a set (prep once, eat twice)
- Snack: flexible ~200 kcal budget — do NOT assign a cooked dish to snack daily
- Set A days: Monday, Tuesday, Wednesday — same meals all 3 days
- Set B days: Thursday, Friday, Saturday, Sunday — same meals all 4 days
- Maximum ${maxRecipes} entries in recipes array (one per unique cooked dish)

USER:
- Cuisines: ${data.cuisines}
- Recent eating: ${data.recentEating}
- Cook frequency: ${data.cookFrequency}
- Dietary restrictions: ${data.dietaryRestrictions || "None"}
- Targets: ${targets.calorie_target} kcal/day, ${targets.protein_target_g}g protein/day

Return ONLY valid JSON:
{
  "meal_sets": {
    "set_a": {
      "days": ["Monday", "Tuesday", "Wednesday"],
      "breakfast": "Specific dish name",
      "lunch": "Specific dish name",
      "dinner": "Can match lunch",
      "snack_budget_kcal": 200,
      "snack_suggestions": ["idea 1", "idea 2", "idea 3"]
    },
    "set_b": {
      "days": ["Thursday", "Friday", "Saturday", "Sunday"],
      "breakfast": "Different specific dish",
      "lunch": "Different specific dish",
      "dinner": "Can match lunch",
      "snack_budget_kcal": 200,
      "snack_suggestions": ["idea 1", "idea 2"]
    }
  },
  "recipes": [
    {
      "meal_name": "must match a breakfast/lunch/dinner name exactly",
      "servings_per_week": number (total portions needed — e.g. lunch+dinner same dish Mon-Wed = 6),
      "calories_per_serving": number,
      "protein_per_serving": number,
      "carbs_per_serving": number,
      "fat_per_serving": number,
      "fiber_per_serving": number,
      "ingredients_per_serving": [{ "name": string, "amount": number, "unit": "g"|"ml"|"whole" }],
      "steps": ["numbered steps"]
    }
  ],
  "meal_prep_schedule": {
    "session_1": {
      "prep_day": "Sunday or Monday",
      "dishes_to_prep": ["list dishes for Set A"],
      "portions_to_make": { "Dish Name": number }
    },
    "session_2": {
      "prep_day": "Wednesday or Thursday",
      "dishes_to_prep": ["list dishes for Set B"],
      "portions_to_make": { "Dish Name": number }
    }
  }
}

portions_to_make must match how many times each dish is eaten (breakfast×3 for Set A, lunch+dinner×3 if same dish = 6, etc.).
Never exceed ${maxRecipes} recipes. Never use generic names like "Lunch" or "High protein meal".`;
}

export function buildFitnessPlanRegeneratePrompt(data: OnboardingFormData): string {
  const sessions = sessionsPerWeekFromFrequency(data.exerciseFrequency);

  return `You are LifeBody AI's strength coach. Create a ${sessions}-session per week gym program.

USER:
- Goal body: ${goalBodyLabel(data.goalBodyType)}
- Exercise frequency: ${data.exerciseFrequency} → ${sessions} gym sessions/week
- Sports enjoyed: ${data.sportsEnjoyed}
- Assume full gym access unless restrictions: ${data.dietaryRestrictions || "none"}

RULES:
- Exactly ${sessions} separate session objects
- 4-6 exercises per session with numeric sets, reps, rest_seconds
- Name sessions clearly (e.g. "Upper Body Day A", "Lower Body Day")
- suggested_days: which weekdays to train
- estimated_duration_minutes per session
- Progressive overload note is added in UI — focus on exercise quality

Return ONLY valid JSON:
{
  "sessions_per_week": ${sessions},
  "sessions": [
    {
      "session_name": "Upper Body Day",
      "focus": "Back, Shoulders, Arms",
      "suggested_days": "Monday or Wednesday",
      "estimated_duration_minutes": 45,
      "exercises": [
        {
          "name": "Lat Pulldown",
          "muscle_group": "Back (Lats)",
          "sets": 3,
          "reps": 12,
          "rest_seconds": 60,
          "coaching_tip": "Pull to upper chest, squeeze lats at bottom."
        }
      ]
    }
  ]
}`;
}
