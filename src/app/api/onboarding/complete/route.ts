import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { upsertOnboardingData } from "@/lib/onboarding/db";
import type { OnboardingFormData } from "@/types/onboarding";
import { GOAL_BODY_OPTIONS } from "@/types/onboarding";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as OnboardingFormData;

  const goalLabel =
    GOAL_BODY_OPTIONS.find((g) => g.id === body.goalBodyType)?.title ??
    body.goalBodyType;

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
      updated_at: new Date().toISOString(),
    })
    .eq("id", user!.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
