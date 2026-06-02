import { NextResponse } from "next/server";
import { requirePremium } from "@/lib/api/auth";
import { normalizeProgram, goalBodyLabel } from "@/lib/program/normalize";
import {
  programNeedsFitnessRegeneration,
  programNeedsMealRegeneration,
} from "@/lib/program/validatePlans";
import { ensureProgramPlans } from "@/lib/program/regeneratePlans";
import type { BodyAssessment } from "@/types/onboarding";
import type { GeneratedProgram } from "@/types/program";
import { getRequestLocale } from "@/lib/i18n/server";

export async function POST(request: Request) {
  const { user, supabase, premiumError } = await requirePremium();
  if (premiumError) return premiumError;

  let part: "meal" | "fitness" | "both" = "both";
  try {
    const body = await request.json();
    if (body.part === "meal" || body.part === "fitness" || body.part === "both") {
      part = body.part;
    }
  } catch {
    // default both
  }

  const onboardingRes = await supabase
    .from("onboarding_data")
    .select("current_weight_kg, body_assessment, cook_frequency")
    .eq("user_id", user!.id)
    .single();

  const assessment = onboardingRes.data?.body_assessment as
    | BodyAssessment
    | undefined;
  const currentWeight = Number(onboardingRes.data?.current_weight_kg ?? 70);
  const goalWeight = assessment?.goal_weight_kg ?? currentWeight;

  try {
    const cookFreq = onboardingRes.data?.cook_frequency ?? "2-3x";
    const locale = await getRequestLocale(user!.id);
    const updated = await ensureProgramPlans(supabase, user!.id, part, locale);
    const program = normalizeProgram(updated, {
      currentWeightKg: currentWeight,
      goalWeightKg: goalWeight,
      cookFrequency: cookFreq,
    });

    return NextResponse.json({
      program,
      mealReady: !programNeedsMealRegeneration(updated, cookFreq),
      fitnessReady: !programNeedsFitnessRegeneration(updated),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to build plans";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
