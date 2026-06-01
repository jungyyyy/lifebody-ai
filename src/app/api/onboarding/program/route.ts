import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { generateGeminiJson } from "@/lib/gemini";
import { buildProgramPrompt } from "@/lib/onboarding/prompts";
import { upsertOnboardingData } from "@/lib/onboarding/db";
import type { GeneratedProgram, OnboardingFormData } from "@/types/onboarding";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as OnboardingFormData;

  if (!body.assessment) {
    return NextResponse.json(
      { error: "Body assessment is required" },
      { status: 400 }
    );
  }

  try {
    const program = await generateGeminiJson<GeneratedProgram>(
      buildProgramPrompt(body, body.assessment)
    );

    // Enforce calorie floor and protein minimum server-side
    const weight = parseFloat(body.currentWeightKg);
    program.calorie_target = Math.max(1450, program.calorie_target);
    program.protein_target_g = Math.max(
      90,
      Math.round(weight * 1.8),
      program.protein_target_g
    );
    program.weekly_fat_loss_kg = Math.min(
      0.7,
      Math.max(0.5, program.weekly_fat_loss_kg ?? 0.6)
    );

    const { error: onboardingError } = await upsertOnboardingData(
      supabase,
      user!.id,
      body
    );

    if (onboardingError) {
      return NextResponse.json({ error: onboardingError.message }, { status: 500 });
    }

    const { error: programError } = await supabase.from("user_programs").upsert(
      {
        user_id: user!.id,
        block_number: 1,
        program,
      },
      { onConflict: "user_id,block_number" }
    );

    if (programError) {
      return NextResponse.json({ error: programError.message }, { status: 500 });
    }

    return NextResponse.json({ program });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Program generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
