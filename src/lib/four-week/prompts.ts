import type { FourWeekBlockPayload } from "@/lib/four-week/fetchBlockData";
import { formatBlockDataForPrompt } from "@/lib/four-week/fetchBlockData";

export function buildFourWeekAnalysisPrompt(data: FourWeekBlockPayload): string {
  const expectedLoss = data.weeklyLossRateKg * 4;
  const actualLoss =
    data.weights.length >= 2
      ? data.weights[0].weight_kg - data.weights[data.weights.length - 1].weight_kg
      : null;

  const isMuscleGoal =
    data.goalBodyType === "muscular_powerful" ||
    data.goalBodyType === "slim_strong" ||
    data.goalBodyType === "lean_athletic";

  const atBlockEnd = data.programWeek % 12 === 0 || data.blockNumber * 4 === 12;
  const hasMoreToLose = data.currentWeightKg > data.goalWeightKg + 0.5;

  return `You are LifeBody AI's senior coach writing a 4-WEEK DEEP ANALYSIS for ${data.nickname}.
This is deeper than weekly reports — analyze trends across the full 4-week block with evidence only.

${formatBlockDataForPrompt(data)}

COMPUTED (verify against raw data):
- Expected 4-week weight loss: ${expectedLoss.toFixed(1)} kg
- Actual weight change (first to last log in block): ${actualLoss != null ? `${actualLoss.toFixed(1)} kg` : "insufficient weight logs"}
- Program week now: ${data.programWeek}
- Original planned end date: ${data.programEndDate}

ANALYSIS REQUIREMENTS:

1. OVERALL PROGRESS VS PLAN — ahead/on_track/behind, pace_gap_kg, likely reason if behind
2. LONG-TERM PATTERNS (4 weeks) — weekday overeating, under-journaling days, weekly weight cycles, protein vs loss correlation, calorie drift
3. BODY RECOMPOSITION — ${isMuscleGoal ? "check if weight flat + consistent training = possible recomp" : "only if goal involves muscle"}
4. DIET QUALITY — protein trend, restriction-binge cycles, meal plan adherence week over week
5. FITNESS — session count trend vs week 1, progression advice
6. PROGRAM RECALIBRATION — if actual pace differs from plan, compute updated_end_date (YYYY-MM-DD). original_end_date = "${data.programEndDate}". Only change if evidence supports it.
7. MAINTENANCE BREAK — recommend if ${atBlockEnd && hasMoreToLose ? "YES: end of 12-week block with more weight to lose" : "only if week 12 block end AND user has more to lose"}

RULES:
- Never hallucinate patterns — cite dates and numbers in evidence fields
- long_term_patterns can be empty if insufficient data
- Warn if average loss > 1kg/week
- coach_letter: warm, honest, 3-5 sentences personal to this user

Return ONLY valid JSON:
{
  "analysis_period": "${data.analysisPeriod}",
  "total_weight_change_kg": number,
  "expected_weight_change_kg": ${expectedLoss.toFixed(1)},
  "on_track": boolean,
  "pace": "ahead" | "on_track" | "behind",
  "pace_gap_kg": number (positive = ahead, negative = behind),
  "long_term_patterns": [{ "pattern": string, "evidence": string, "advice": string }],
  "diet_quality_trend": "improving" | "stable" | "declining",
  "fitness_trend": "improving" | "stable" | "declining",
  "protein_trend": "improving" | "stable" | "declining",
  "program_recalibration": {
    "original_end_date": "${data.programEndDate}",
    "updated_end_date": "YYYY-MM-DD",
    "reason": string
  },
  "maintenance_break_recommended": boolean,
  "maintenance_break_message": string or null,
  "next_4_weeks_focus": [string, string, string],
  "coach_letter": string
}`;
}
