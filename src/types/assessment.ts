export type PatternType =
  | "trigger_food"
  | "fasting_correlation"
  | "period_weight"
  | "sport_overeating"
  | "consistency"
  | "calorie_floor"
  | "weight_alert"
  | "plateau";

export interface DetectedPattern {
  type: PatternType;
  insight: string;
  advice: string;
}

export interface AssessmentProgramUpdates {
  rule_notes: string[];
  fasting_window?: string | null;
  fasting_is_intermittent?: boolean | null;
  meal_plan_adjustment_request?: string | null;
}

export interface WeeklyAssessmentData {
  week_number: number;
  weight_change_kg: number;
  avg_daily_calories: number;
  avg_daily_protein: number;
  avg_fasting_hours: number;
  days_journaled: number;
  sport_sessions: number;
  on_track: boolean;
  patterns_detected: DetectedPattern[];
  highlights: string[];
  next_week_meal_plan_changes: string;
  program_rule_updates: string[];
  motivational_message: string;
  insufficient_data_note?: string | null;
  program_updates?: AssessmentProgramUpdates | null;
  /** @deprecated Legacy assessments */
  concerns?: string[];
  behavior_insight?: string | null;
  trigger_food_warning?: string | null;
  next_week_adjustment?: string;
  meal_plan_update?: string | null;
}

export interface WeeklyAssessmentRecord {
  id: string;
  week_number: number;
  period_start: string;
  period_end: string;
  assessment: WeeklyAssessmentData;
  created_at: string;
}

export function assessmentPatterns(
  a: WeeklyAssessmentData
): DetectedPattern[] {
  if (a.patterns_detected?.length) return a.patterns_detected;
  const legacy: DetectedPattern[] = [];
  if (a.behavior_insight) {
    legacy.push({
      type: "consistency",
      insight: a.behavior_insight,
      advice: a.next_week_adjustment ?? a.next_week_meal_plan_changes ?? "",
    });
  }
  if (a.trigger_food_warning) {
    legacy.push({
      type: "trigger_food",
      insight: a.trigger_food_warning,
      advice: "",
    });
  }
  if (a.concerns?.length) {
    for (const c of a.concerns) {
      legacy.push({ type: "weight_alert", insight: c, advice: "" });
    }
  }
  return legacy;
}
