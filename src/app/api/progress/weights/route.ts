import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { addDays, localDateString } from "@/lib/dates";

export async function GET() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const end = localDateString();
  const start = addDays(end, -13);

  const [logsRes, onboardingRes, profileRes] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("log_date, weight_kg")
      .eq("user_id", user!.id)
      .gte("log_date", start)
      .lte("log_date", end)
      .order("log_date", { ascending: true }),
    supabase
      .from("onboarding_data")
      .select("current_weight_kg")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("profiles")
      .select("program_started_at")
      .eq("id", user!.id)
      .single(),
  ]);

  const points = (logsRes.data ?? []).map((r) => ({
    date: r.log_date as string,
    weight: Number(r.weight_kg),
  }));

  const startWeight = Number(onboardingRes.data?.current_weight_kg ?? 0);
  const currentWeight =
    points.length > 0 ? points[points.length - 1].weight : startWeight;

  const weekStart = addDays(end, -6);
  const weekPoints = points.filter((p) => p.date >= weekStart);
  const weekTrend =
    weekPoints.length >= 2
      ? Math.round(
          (weekPoints[weekPoints.length - 1].weight - weekPoints[0].weight) * 10
        ) / 10
      : null;

  const totalChange =
    startWeight && currentWeight
      ? Math.round((currentWeight - startWeight) * 10) / 10
      : 0;

  return NextResponse.json({
    points,
    startWeight,
    currentWeight,
    totalChange,
    weekTrend,
    programStartedAt: profileRes.data?.program_started_at,
  });
}
