import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { upsertOnboardingData } from "@/lib/onboarding/db";
import {
  calculateProgramWeeks,
  weightToLoseKg,
} from "@/lib/program/duration";
import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as OnboardingFormData;

  const goalLabel =
    GOAL_BODY_OPTIONS.find((g) => g.id === body.goalBodyType)?.title ??
    body.goalBodyType;

  const weight = parseFloat(body.currentWeightKg);
  const weeklyRate = parseFloat(body.weeklyLossRateKg || "0.6");
  const programWeeks = body.assessment
    ? calculateProgramWeeks(
        weightToLoseKg(weight, body.assessment.goal_weight_kg),
        weeklyRate
      )
    : 12;

  const { error: onboardingError } = await upsertOnboardingData(
    supabase,
    user!.id,
    body
  );

  if (onboardingError) {
    return NextResponse.json({ error: onboardingError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      goal: goalLabel,
      nickname: body.nickname.trim(),
      weekly_loss_rate_kg: weeklyRate,
      program_length_weeks: programWeeks,
      program_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user!.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
