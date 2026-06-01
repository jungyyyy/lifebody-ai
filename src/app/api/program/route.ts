import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { normalizeProgram, goalBodyLabel } from "@/lib/program/normalize";
import { programEndDate, programWeekNumber } from "@/lib/program/dates";
import type { BodyAssessment } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";

export async function GET() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const [profileRes, onboardingRes, programRes, weightRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("program_started_at")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("onboarding_data")
      .select("current_weight_kg, goal_body_type, body_assessment")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", user!.id)
      .eq("block_number", 1)
      .maybeSingle(),
    supabase
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", user!.id)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!programRes.data?.program) {
    return NextResponse.json(
      { error: "No program found. Complete onboarding first." },
      { status: 404 }
    );
  }

  const assessment = onboardingRes.data?.body_assessment as
    | BodyAssessment
    | undefined;
  const currentWeight =
    weightRes.data?.weight_kg != null
      ? Number(weightRes.data.weight_kg)
      : Number(onboardingRes.data?.current_weight_kg ?? 0);
  const goalWeight = assessment?.goal_weight_kg ?? currentWeight;

  const raw = programRes.data.program as GeneratedProgram;
  const program = normalizeProgram(raw, {
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
    cuisines: undefined,
  });

  const startIso =
    profileRes.data?.program_started_at ?? new Date().toISOString();
  const startDate = startIso.split("T")[0];

  return NextResponse.json({
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
    goalBodyLabel: goalBodyLabel(
      onboardingRes.data?.goal_body_type ?? ""
    ),
    startDate,
    endDate: programEndDate(startDate),
    currentWeek: programWeekNumber(startIso),
    program,
  });
}
