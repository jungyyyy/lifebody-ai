import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import type { Sex } from "@/types/onboarding";

export async function PATCH(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const firstName =
    body.first_name != null ? String(body.first_name).trim() : undefined;
  const lastName =
    body.last_name != null ? String(body.last_name).trim() : undefined;
  const avatarUrl =
    body.avatar_url != null ? String(body.avatar_url).trim() || null : undefined;
  const dateOfBirth =
    body.date_of_birth != null
      ? String(body.date_of_birth).trim() || null
      : undefined;
  const sex = body.sex as Sex | undefined;

  const profileUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (firstName !== undefined) profileUpdates.first_name = firstName || null;
  if (lastName !== undefined) profileUpdates.last_name = lastName || null;
  if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;
  if (dateOfBirth !== undefined) profileUpdates.date_of_birth = dateOfBirth;

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdates)
    .eq("id", user!.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (sex && ["male", "female", "prefer_not_to_say"].includes(sex)) {
    await supabase
      .from("onboarding_data")
      .update({ sex, updated_at: new Date().toISOString() })
      .eq("user_id", user!.id);
  }

  return NextResponse.json({ success: true });
}
