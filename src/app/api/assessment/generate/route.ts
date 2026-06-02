import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import { generateWeeklyAssessment } from "@/lib/assessment/generate";
import { canShowWeeklyAssessmentCta } from "@/lib/assessment/visibility";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";
import { localDateString } from "@/lib/dates";
import { getRequestLocale } from "@/lib/i18n/server";

export async function POST(request: Request) {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  let body: { periodEnd?: string; weekNumber?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body ok
  }

  const [profileRes, programWeeks] = await Promise.all([
    supabase
      .from("profiles")
      .select("program_started_at")
      .eq("id", user!.id)
      .single(),
    getProgramLengthWeeks(supabase, user!.id),
  ]);

  const profile = profileRes.data;

  const weekNumber =
    body.weekNumber ??
    (profile?.program_started_at
      ? programWeekNumber(profile.program_started_at, programWeeks)
      : 1);

  if (!canShowWeeklyAssessmentCta(profile?.program_started_at)) {
    return NextResponse.json(
      { error: "Weekly report is only available Sun–Wed after 6 days on program" },
      { status: 403 }
    );
  }

  try {
    const locale = await getRequestLocale(user!.id);
    const saved = await generateWeeklyAssessment(supabase, user!.id, {
      periodEnd: body.periodEnd ?? localDateString(),
      weekNumber,
      locale,
    });

    return NextResponse.json({
      id: saved.id,
      week_number: saved.week_number,
      assessment: saved.assessment,
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Assessment generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
