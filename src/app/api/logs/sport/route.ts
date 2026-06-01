import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { localDateString } from "@/lib/dates";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const activity = String(body.activity ?? "").trim();
  const durationMinutes = parseInt(String(body.durationMinutes), 10);
  const date = String(body.date ?? localDateString());

  if (!activity) {
    return NextResponse.json({ error: "Activity is required" }, { status: 400 });
  }
  if (!durationMinutes || durationMinutes < 1) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("sport_logs").insert({
    user_id: user!.id,
    log_date: date,
    activity,
    duration_minutes: durationMinutes,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
