export type TrendDirection = "improving" | "stable" | "declining";
export type PaceStatus = "ahead" | "on_track" | "behind";

export interface LongTermPattern {
  pattern: string;
  evidence: string;
  advice: string;
}

export interface ProgramRecalibration {
  original_end_date: string;
  updated_end_date: string;
  reason: string;
}

export interface FourWeekAnalysisData {
  analysis_period: string;
  total_weight_change_kg: number;
  expected_weight_change_kg: number;
  on_track: boolean;
  pace: PaceStatus;
  pace_gap_kg: number;
  long_term_patterns: LongTermPattern[];
  diet_quality_trend: TrendDirection;
  fitness_trend: TrendDirection;
  protein_trend: TrendDirection;
  program_recalibration: ProgramRecalibration;
  maintenance_break_recommended: boolean;
  maintenance_break_message: string | null;
  next_4_weeks_focus: string[];
  coach_letter: string;
}

export interface FourWeekAnalysisRecord {
  id: string;
  block_number: number;
  week_range: string;
  period_start: string;
  period_end: string;
  analysis: FourWeekAnalysisData;
  created_at: string;
}
