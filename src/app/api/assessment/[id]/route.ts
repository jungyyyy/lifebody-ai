import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import type { WeeklyAssessmentData } from "@/types/assessment";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("weekly_assessments")
    .select("id, week_number, period_start, period_end, assessment, created_at")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    week_number: data.week_number,
    period_start: data.period_start,
    period_end: data.period_end,
    assessment: data.assessment as WeeklyAssessmentData,
    created_at: data.created_at,
  });
}
