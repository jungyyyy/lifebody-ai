export type ActivityLevel = "never_rarely" | "one_two" | "three_five" | "daily";

export interface ProgramCalculationInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female" | "prefer_not_to_say";
  exerciseFrequency: string;
  weeklyLossRateKg: number;
}

export interface ProgramCalculation {
  bmr: number;
  tdee: number;
  target_deficit: number;
  calculated_calories: number;
  floor_applied: boolean;
  final_calories: number;
  final_protein_g: number;
  actual_weekly_loss_kg: number;
}

function activityFromExerciseFrequency(freq: string): ActivityLevel {
  const f = freq.toLowerCase();
  if (f.includes("daily")) return "daily";
  if (f.includes("3-5")) return "three_five";
  if (f.includes("1-2")) return "one_two";
  return "never_rarely";
}

function activityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case "daily":
      return 1.725;
    case "three_five":
      return 1.55;
    case "one_two":
      return 1.375;
    case "never_rarely":
    default:
      return 1.2;
  }
}

function deficitForWeeklyRate(rate: number): number {
  if (rate >= 0.7) return 770;
  if (rate <= 0.5) return 550;
  return 660; // default 0.6kg/week
}

function calorieFloor(sex: ProgramCalculationInput["sex"]): number {
  return sex === "female" ? 1400 : 1600;
}

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function calculateProgramTargets(input: ProgramCalculationInput): ProgramCalculation {
  const age = Number.isFinite(input.age) && input.age > 0 ? input.age : 25;
  const sex = input.sex ?? "prefer_not_to_say";
  const bmr =
    sex === "female"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * age - 161
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + 5;

  const tdee = bmr * activityMultiplier(activityFromExerciseFrequency(input.exerciseFrequency));
  const targetDeficit = deficitForWeeklyRate(input.weeklyLossRateKg);
  const calculatedCalories = tdee - targetDeficit;
  const floor = calorieFloor(sex);
  const floorApplied = calculatedCalories < floor;
  const finalCalories = floorApplied ? floor : calculatedCalories;

  const actualDeficit = tdee - finalCalories;
  const actualWeeklyLossKg = Math.max(0, actualDeficit / 7700);

  const baseProtein = input.weightKg * 1.8;
  const maxProteinByCalories = (finalCalories * 0.4) / 4;
  const finalProtein = roundTo5(Math.min(baseProtein, maxProteinByCalories));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target_deficit: Math.round(targetDeficit),
    calculated_calories: Math.round(calculatedCalories),
    floor_applied: floorApplied,
    final_calories: Math.round(finalCalories),
    final_protein_g: Math.max(60, finalProtein),
    actual_weekly_loss_kg: Number(actualWeeklyLossKg.toFixed(2)),
  };
}

export function beginnerWorkoutNote(exerciseFrequency: string): string | null {
  const f = exerciseFrequency.toLowerCase();
  if (!f.includes("never") && !f.includes("rarely")) return null;
  return "Since you're new to working out, we're starting slow so you actually stick with it. One session in week 1-2, then we add a second session from week 3.";
}
