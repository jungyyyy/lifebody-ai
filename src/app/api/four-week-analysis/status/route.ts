import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import { weekRangeLabel } from "@/lib/four-week/block";
import {
  canShowFourWeekAnalysisCta,
  pendingFourWeekBlock,
} from "@/lib/four-week/visibility";
import { programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";

export async function GET() {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  const [profileRes, programWeeks, allAnalysesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("program_started_at, last_4week_analysis_at")
      .eq("id", user!.id)
      .single(),
    getProgramLengthWeeks(supabase, user!.id),
    supabase
      .from("four_week_analyses")
      .select("id, block_number, week_range")
      .eq("user_id", user!.id)
      .order("block_number", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const programWeek = profile?.program_started_at
    ? programWeekNumber(profile.program_started_at, programWeeks)
    : 1;

  const completedBlocks = (allAnalysesRes.data ?? []).map(
    (r) => r.block_number as number
  );
  const pendingBlock = pendingFourWeekBlock(programWeek, completedBlocks);

  const pendingAnalysis = pendingBlock
    ? (allAnalysesRes.data ?? []).find((r) => r.block_number === pendingBlock)
    : null;

  const canShowCta = canShowFourWeekAnalysisCta(programWeek, completedBlocks);

  return NextResponse.json({
    programWeek,
    pendingBlockNumber: pendingBlock,
    weekRange: pendingBlock ? weekRangeLabel(pendingBlock) : null,
    canShowCta,
    hasAnalysis: pendingBlock == null && programWeek >= 4,
    analysisId: pendingAnalysis?.id ?? null,
    lastFourWeekAnalysisAt: profile?.last_4week_analysis_at ?? null,
  });
}
