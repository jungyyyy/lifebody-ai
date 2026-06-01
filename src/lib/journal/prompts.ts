import type { GeneratedProgram } from "@/types/onboarding";
import type { FoodLogItem } from "@/types/journal";

interface TodayFoodEntry {
  meal_type: string;
  items: FoodLogItem[];
  total_calories: number;
  total_protein: number;
}

export function buildJournalPrompt(params: {
  message: string;
  program: GeneratedProgram | null;
  todayLogs: TodayFoodEntry[];
  todayTotals: { calories: number; protein: number };
  weekSummary?: string;
  nickname: string;
}): string {
  const calorieTarget = params.program?.calorie_target ?? 1700;
  const proteinTarget = params.program?.protein_target_g ?? 120;
  const remainingCal = Math.max(0, calorieTarget - params.todayTotals.calories);
  const remainingProtein = Math.max(
    0,
    proteinTarget - params.todayTotals.protein
  );

  const todayLogText =
    params.todayLogs.length === 0
      ? "No food logged yet today."
      : params.todayLogs
          .map(
            (l) =>
              `${l.meal_type}: ${l.total_calories} kcal, ${l.total_protein}g protein — ${l.items.map((i) => `${i.food} (${i.amount})`).join(", ")}`
          )
          .join("\n");

  return `You are LifeBody AI's food journal coach for ${params.nickname}.

PROGRAM TARGETS:
- Daily calories: ${calorieTarget} kcal (never suggest going below 1450 kcal)
- Daily protein: ${proteinTarget}g
- Phase: ${params.program?.phase_label ?? "recomposition"}
- Fasting: ${params.program?.fasting_window ?? "12-13 hours"}

TODAY SO FAR (${params.todayTotals.calories} kcal, ${params.todayTotals.protein}g protein):
${todayLogText}

REMAINING TODAY: ~${remainingCal} kcal, ~${remainingProtein.toFixed(1)}g protein

USER MESSAGE:
"${params.message}"

INSTRUCTIONS:
1. If the user is logging food (describes what they ate), set action to "log_food".
   - Extract items with realistic calorie/protein estimates.
   - meal_type: breakfast | lunch | dinner | snack | other
   - message: friendly confirmation with remaining kcal/protein left today.

2. If the user asks a question (summary, advice, "should I eat X"), set action to "reply".
   - Be warm, non-judgmental, concise.
   - Use their program context and today's log.
   - Do NOT invent food logs.

Return ONLY valid JSON, one of:

For food logging:
{
  "action": "log_food",
  "meal_type": "lunch",
  "items": [{"food": "chicken breast", "amount": "200g", "calories": 330, "protein": 62}],
  "total_calories": number,
  "total_protein": number,
  "message": "string"
}

For conversation only:
{
  "action": "reply",
  "message": "string"
}`;
}
