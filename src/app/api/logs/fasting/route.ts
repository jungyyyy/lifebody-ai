import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { localDateString } from "@/lib/dates";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const hours = parseFloat(String(body.hours));
  const date = String(body.date ?? localDateString());

  if (!hours || hours < 1 || hours > 48) {
    return NextResponse.json({ error: "Invalid fasting hours" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { error: upsertError } = await admin.from("fasting_logs").upsert(
    { user_id: user!.id, log_date: date, hours },
    { onConflict: "user_id,log_date" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, hours });
}
