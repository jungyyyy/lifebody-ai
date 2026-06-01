import { addDays, daysBetween } from "@/lib/dates";

const BLOCK_DAYS = 84;

export function programEndDate(startIso: string): string {
  return addDays(startIso.split("T")[0], BLOCK_DAYS - 1);
}

export function programWeekNumber(startIso: string): number {
  const days = daysBetween(startIso);
  return Math.min(12, Math.max(1, Math.ceil(days / 7)));
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
