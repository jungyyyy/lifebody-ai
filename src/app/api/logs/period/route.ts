import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { localDateString } from "@/lib/dates";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const active = Boolean(body.active);
  const date = String(body.date ?? localDateString());

  if (active) {
    const { error: insertError } = await supabase.from("period_logs").upsert(
      { user_id: user!.id, log_date: date },
      { onConflict: "user_id,log_date" }
    );
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    await supabase
      .from("period_logs")
      .delete()
      .eq("user_id", user!.id)
      .eq("log_date", date);
  }

  return NextResponse.json({ active });
}
