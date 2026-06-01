import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { GOAL_BODY_OPTIONS, type GoalBodyType } from "@/types/onboarding";
import {
  loadOnboardingForUser,
  regenerateFitnessPlan,
  regenerateMealPlan,
} from "@/lib/program/regeneratePlans";
import type { GeneratedProgram } from "@/types/program";

export async function PATCH(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const regenerate = body.regenerate === true;

  const { data: existing } = await supabase
    .from("onboarding_data")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Onboarding data not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.current_weight_kg != null) {
    const w = parseFloat(String(body.current_weight_kg));
    if (!Number.isNaN(w) && w > 0) {
      updates.current_weight_kg = w;
      await supabase.from("weight_logs").insert({
        user_id: user!.id,
        weight_kg: w,
        log_date: new Date().toISOString().slice(0, 10),
      });
    }
  }

  if (body.goal_body_type) {
    const valid = GOAL_BODY_OPTIONS.some((g) => g.id === body.goal_body_type);
    if (valid) updates.goal_body_type = body.goal_body_type as GoalBodyType;
  }

  if (body.cook_frequency != null) {
    updates.cook_frequency = String(body.cook_frequency);
  }

  if (body.dietary_restrictions != null) {
    updates.dietary_restrictions =
      String(body.dietary_restrictions).trim() || null;
  }

  if (body.sports_enjoyed != null) {
    updates.sports_enjoyed = String(body.sports_enjoyed).trim();
  }

  const { error: updateError } = await supabase
    .from("onboarding_data")
    .update(updates)
    .eq("user_id", user!.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const goalChanged =
    body.goal_body_type &&
    body.goal_body_type !== existing.goal_body_type;
  const cookChanged =
    body.cook_frequency && body.cook_frequency !== existing.cook_frequency;

  if (regenerate && (goalChanged || cookChanged)) {
    const goalLabel =
      GOAL_BODY_OPTIONS.find((g) => g.id === (body.goal_body_type ?? existing.goal_body_type))
        ?.title ?? "";

    await supabase
      .from("profiles")
      .update({ goal: goalLabel, updated_at: new Date().toISOString() })
      .eq("id", user!.id);

    const onboarding = await loadOnboardingForUser(supabase, user!.id);
    const { data: programRow } = await supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", user!.id)
      .eq("block_number", 1)
      .single();

    if (onboarding && programRow?.program) {
      try {
        let program = programRow.program as GeneratedProgram;
        if (goalChanged || cookChanged) {
          program = {
            ...program,
            meal_plan: await regenerateMealPlan(onboarding, program),
            fitness_plan: await regenerateFitnessPlan(onboarding),
          };
          await supabase
            .from("user_programs")
            .update({ program })
            .eq("user_id", user!.id)
            .eq("block_number", 1);
        }
      } catch (err) {
        console.error("[settings/program] regenerate failed:", err);
      }
    }
  }

  return NextResponse.json({ success: true, regenerated: regenerate && (goalChanged || cookChanged) });
}
