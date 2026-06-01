import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePremium } from "@/lib/api/auth";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  const { data, error: dbError } = await supabase
    .from("four_week_analyses")
    .select(
      "id, block_number, week_range, period_start, period_end, analysis, created_at"
    )
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    block_number: data.block_number,
    week_range: data.week_range,
    period_start: data.period_start,
    period_end: data.period_end,
    created_at: data.created_at,
    analysis: data.analysis as FourWeekAnalysisData,
    weights: await fetchBlockWeights(
      supabase,
      user!.id,
      data.period_start as string,
      data.period_end as string
    ),
  });
}

async function fetchBlockWeights(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string
) {
  const { data } = await supabase
    .from("weight_logs")
    .select("log_date, weight_kg")
    .eq("user_id", userId)
    .gte("log_date", periodStart)
    .lte("log_date", periodEnd)
    .order("log_date", { ascending: true });

  return (data ?? []).map((w) => ({
    date: w.log_date as string,
    weight: Number(w.weight_kg),
  }));
}
