import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { generateGeminiJson } from "@/lib/gemini";
import { getRequestLocale } from "@/lib/i18n/server";
import { buildAssessmentPrompt } from "@/lib/onboarding/prompts";
import { upsertOnboardingData } from "@/lib/onboarding/db";
import type { BodyAssessment, OnboardingFormData } from "@/types/onboarding";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as OnboardingFormData;

  try {
    const locale = await getRequestLocale(user!.id);
    const assessment = await generateGeminiJson<BodyAssessment>(
      buildAssessmentPrompt(body),
      undefined,
      undefined,
      locale
    );

    const dataWithAssessment: OnboardingFormData = {
      ...body,
      assessment,
    };

    const { error: dbError } = await upsertOnboardingData(
      supabase,
      user!.id,
      dataWithAssessment
    );

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ assessment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assessment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
