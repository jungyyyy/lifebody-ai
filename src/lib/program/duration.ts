/** Weeks needed to reach goal at given weekly loss rate (rounded up). */
export function calculateProgramWeeks(
  weightToLoseKg: number,
  weeklyLossRateKg: number
): number {
  if (weightToLoseKg <= 0) return 4;
  const rate = weeklyLossRateKg > 0 ? weeklyLossRateKg : 0.6;
  return Math.max(1, Math.ceil(weightToLoseKg / rate));
}

export function programTotalDays(weeks: number): number {
  return weeks * 7;
}

export function weightToLoseKg(
  currentWeightKg: number,
  goalWeightKg: number
): number {
  return Math.max(0, currentWeightKg - goalWeightKg);
}

export function needsMaintenanceBlock(weightToLoseKg: number): boolean {
  return weightToLoseKg > 8;
}
