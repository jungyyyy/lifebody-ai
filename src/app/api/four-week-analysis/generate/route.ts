import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { generateFourWeekAnalysis } from "@/lib/four-week/generate";
import {
  canShowFourWeekAnalysisCta,
  pendingFourWeekBlock,
} from "@/lib/four-week/visibility";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";

export async function POST() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const [profileRes, programWeeks, analysesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("program_started_at")
      .eq("id", user!.id)
      .single(),
    getProgramLengthWeeks(supabase, user!.id),
    supabase
      .from("four_week_analyses")
      .select("block_number")
      .eq("user_id", user!.id),
  ]);

  const programWeek = profileRes.data?.program_started_at
    ? programWeekNumber(profileRes.data.program_started_at, programWeeks)
    : 1;

  const completedBlocks = (analysesRes.data ?? []).map(
    (r) => r.block_number as number
  );

  const blockNumber = pendingFourWeekBlock(programWeek, completedBlocks);

  if (!blockNumber || !canShowFourWeekAnalysisCta(programWeek, completedBlocks)) {
    return NextResponse.json(
      { error: "4-week analysis is not available yet" },
      { status: 403 }
    );
  }

  try {
    const saved = await generateFourWeekAnalysis(
      supabase,
      user!.id,
      blockNumber
    );
    return NextResponse.json({
      id: saved.id,
      block_number: saved.block_number,
      week_range: saved.week_range,
      analysis: saved.analysis,
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "4-week analysis generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
