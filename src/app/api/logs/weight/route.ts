import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { addDays } from "@/lib/dates";
import { localDateString } from "@/lib/dates";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const weightKg = parseFloat(String(body.weightKg));
  const date = String(body.date ?? localDateString());

  if (!weightKg || weightKg < 30 || weightKg > 300) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }

  const { error: upsertError } = await supabase.from("weight_logs").upsert(
    { user_id: user!.id, log_date: date, weight_kg: weightKg },
    { onConflict: "user_id,log_date" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const weekAgo = addDays(date, -7);
  const [{ data: lastEntry }, { data: weekStartEntry }] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight_kg, log_date")
      .eq("user_id", user!.id)
      .lt("log_date", date)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("weight_logs")
      .select("weight_kg")
      .eq("user_id", user!.id)
      .lte("log_date", weekAgo)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let trendMessage: string | null = null;
  let rapidLossWarning = false;

  if (lastEntry) {
    const diff = weightKg - Number(lastEntry.weight_kg);
    const arrow = diff < 0 ? "📉" : diff > 0 ? "📈" : "➡️";
    const abs = Math.abs(diff).toFixed(1);
    trendMessage =
      diff < 0
        ? `You're down ${abs}kg from your last entry ${arrow}`
        : diff > 0
          ? `You're up ${abs}kg from your last entry ${arrow}`
          : `Same as your last entry ${arrow}`;
  } else {
    trendMessage = "Weight logged for today ✓";
  }

  const weekBaseline = weekStartEntry
    ? Number(weekStartEntry.weight_kg)
    : lastEntry
      ? Number(lastEntry.weight_kg)
      : null;

  if (weekBaseline !== null && weightKg - weekBaseline <= -1) {
    rapidLossWarning = true;
    trendMessage = `You're down ${Math.abs(weightKg - weekBaseline).toFixed(1)}kg this week 📉`;
  }

  return NextResponse.json({
    weightKg,
    trendMessage,
    rapidLossWarning,
    warningMessage: rapidLossWarning
      ? "You've lost more than 1kg since your last log. Make sure you're not eating below 1450kcal — fast loss often leads to rebound."
      : null,
  });
}
