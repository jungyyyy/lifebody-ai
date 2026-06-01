import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import type { WeeklyAssessmentData } from "@/types/assessment";

export async function GET() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("weekly_assessments")
    .select("id, week_number, period_start, period_end, assessment, created_at")
    .eq("user_id", user!.id)
    .order("week_number", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const assessments = (data ?? []).map((row) => ({
    id: row.id,
    week_number: row.week_number,
    period_start: row.period_start,
    period_end: row.period_end,
    assessment: row.assessment as WeeklyAssessmentData,
    created_at: row.created_at,
    on_track: (row.assessment as WeeklyAssessmentData).on_track,
  }));

  return NextResponse.json({ assessments });
}
