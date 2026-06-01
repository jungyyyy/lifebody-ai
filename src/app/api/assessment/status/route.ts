import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import {
  canShowWeeklyAssessmentCta,
} from "@/lib/assessment/visibility";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";

export async function GET() {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  const [profileRes, programWeeks] = await Promise.all([
    supabase
      .from("profiles")
      .select("program_started_at")
      .eq("id", user!.id)
      .single(),
    getProgramLengthWeeks(supabase, user!.id),
  ]);

  const profile = profileRes.data;

  const weekNumber = profile?.program_started_at
    ? programWeekNumber(profile.program_started_at, programWeeks)
    : 1;

  const { data: existing } = await supabase
    .from("weekly_assessments")
    .select("id, week_number")
    .eq("user_id", user!.id)
    .eq("week_number", weekNumber)
    .maybeSingle();

  const canShowCta = canShowWeeklyAssessmentCta(profile?.program_started_at);

  return NextResponse.json({
    weekNumber,
    canShowCta,
    hasAssessment: !!existing,
    assessmentId: existing?.id ?? null,
    ready: !!existing,
  });
}
