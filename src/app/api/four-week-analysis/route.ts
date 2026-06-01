import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";

export async function GET() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("four_week_analyses")
    .select("id, block_number, week_range, period_start, period_end, analysis, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const analyses = (data ?? []).map((row) => {
    const a = row.analysis as FourWeekAnalysisData;
    return {
      id: row.id,
      block_number: row.block_number,
      week_range: row.week_range,
      period_start: row.period_start,
      period_end: row.period_end,
      created_at: row.created_at,
      on_track: a.on_track,
      pace: a.pace,
      coach_letter: a.coach_letter,
    };
  });

  return NextResponse.json({ analyses });
}
