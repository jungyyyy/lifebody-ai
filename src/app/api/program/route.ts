import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import { normalizeProgram, goalBodyLabel } from "@/lib/program/normalize";
import { programEndDate, programWeekNumber } from "@/lib/program/dates";
import { getProgramLengthWeeks } from "@/lib/program/profile";
import type { BodyAssessment } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";

export async function GET() {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  const [profileRes, onboardingRes, programRes, weightRes, programWeeks] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("program_started_at")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("onboarding_data")
        .select(
          "current_weight_kg, height_cm, goal_body_type, body_assessment, cook_frequency"
        )
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
      getProgramLengthWeeks(supabase, user!.id),
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
  const heightCm = Number(onboardingRes.data?.height_cm ?? 170);

  const raw = programRes.data.program as GeneratedProgram;
  const program = normalizeProgram(raw, {
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
    cookFrequency: onboardingRes.data?.cook_frequency ?? "2-3x",
  });

  const startIso =
    profileRes.data?.program_started_at ?? new Date().toISOString();
  const startDate = startIso.split("T")[0];

  return NextResponse.json({
    currentWeightKg: currentWeight,
    goalWeightKg: goalWeight,
    heightCm,
    goalBodyLabel: goalBodyLabel(onboardingRes.data?.goal_body_type ?? ""),
    startDate,
    endDate: programEndDate(startDate, programWeeks),
    currentWeek: programWeekNumber(startIso, programWeeks),
    programLengthWeeks: programWeeks,
    program,
  });
}
