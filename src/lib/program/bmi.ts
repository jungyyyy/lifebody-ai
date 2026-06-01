export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getFastingRecommendation(
  weightKg: number,
  heightCm: number
): { window: string; isIntermittentFasting: boolean } {
  const bmi = calculateBmi(weightKg, heightCm);
  if (bmi > 25) {
    return {
      window:
        "16:8 intermittent fasting — eat within an 8-hour window, fast for 16 hours daily",
      isIntermittentFasting: true,
    };
  }
  return {
    window:
      "12–13 hour overnight fast — finish dinner by 8pm, eat breakfast after 8–9am",
    isIntermittentFasting: false,
  };
}
