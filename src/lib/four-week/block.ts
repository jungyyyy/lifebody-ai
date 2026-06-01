import { addDays } from "@/lib/dates";
import { programEndDate } from "@/lib/program/dates";

/** 1 = weeks 1–4, 2 = weeks 5–8, etc. */
export function blockNumberForProgramWeek(programWeek: number): number {
  return Math.max(1, Math.ceil(programWeek / 4));
}

export function weekRangeLabel(blockNumber: number): string {
  const start = (blockNumber - 1) * 4 + 1;
  const end = blockNumber * 4;
  return `Week ${start}–${end}`;
}

export function analysisPeriodLabel(blockNumber: number): string {
  return weekRangeLabel(blockNumber);
}

export function blockDateRange(
  programStartDate: string,
  blockNumber: number
): { periodStart: string; periodEnd: string; startWeek: number; endWeek: number } {
  const startWeek = (blockNumber - 1) * 4 + 1;
  const endWeek = blockNumber * 4;
  const periodStart = addDays(programStartDate, (startWeek - 1) * 7);
  const periodEnd = addDays(programStartDate, endWeek * 7 - 1);
  return { periodStart, periodEnd, startWeek, endWeek };
}

export function programEndDateIso(
  programStartIso: string,
  programLengthWeeks: number
): string {
  return programEndDate(programStartIso, programLengthWeeks);
}
