/** Earliest 4-week block due but not yet generated (e.g. week 5 with no week 1–4 analysis → 1). */
export function pendingFourWeekBlock(
  programWeek: number,
  completedBlockNumbers: number[]
): number | null {
  if (programWeek < 4) return null;
  const completed = new Set(completedBlockNumbers);
  const maxDue = Math.floor(programWeek / 4);
  for (let b = 1; b <= maxDue; b++) {
    if (!completed.has(b)) return b;
  }
  return null;
}

export function canShowFourWeekAnalysisCta(
  programWeek: number,
  completedBlockNumbers: number[]
): boolean {
  return pendingFourWeekBlock(programWeek, completedBlockNumbers) != null;
}
