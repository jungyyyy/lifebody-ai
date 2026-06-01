import { daysBetween } from "@/lib/dates";

/** Sun=0 … Wed=3 — assessment CTA window (includes missed Sunday). */
export function isAssessmentWindowDay(date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 1 || day === 2 || day === 3;
}

/** At least 6 full days since program start (started Sat/Sun this week → wait). */
export function hasMinDaysForAssessment(
  programStartedAt: string | null | undefined,
  now = new Date()
): boolean {
  if (!programStartedAt) return false;
  return daysBetween(programStartedAt, now) >= 6;
}

export function canShowWeeklyAssessmentCta(
  programStartedAt: string | null | undefined,
  now = new Date()
): boolean {
  return (
    isAssessmentWindowDay(now) &&
    hasMinDaysForAssessment(programStartedAt, now)
  );
}
