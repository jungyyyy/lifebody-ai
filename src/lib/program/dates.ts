import { addDays, daysBetween } from "@/lib/dates";
import { programTotalDays } from "@/lib/program/duration";

export function programEndDate(
  startIso: string,
  programLengthWeeks: number
): string {
  const startDate = startIso.split("T")[0];
  return addDays(startDate, programTotalDays(programLengthWeeks) - 1);
}

export function programWeekNumber(
  startIso: string,
  programLengthWeeks: number
): number {
  const days = daysBetween(startIso);
  return Math.min(programLengthWeeks, Math.max(1, Math.ceil(days / 7)));
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
