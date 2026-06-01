import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { generateGeminiJson } from "@/lib/gemini";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { buildJournalPrompt } from "@/lib/journal/prompts";
import type { GeneratedProgram } from "@/types/onboarding";
import type { JournalAiResponse } from "@/types/journal";
import { localDateString } from "@/lib/dates";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const message = String(body.message ?? "").trim();
  const date = String(body.date ?? localDateString());

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const [profileRes, programRes, foodTodayRes] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("id", user!.id).single(),
    supabase
      .from("user_programs")
      .select("program")
      .eq("user_id", user!.id)
      .eq("block_number", 1)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select("meal_type, items, total_calories, total_protein")
      .eq("user_id", user!.id)
      .eq("log_date", date)
      .order("created_at", { ascending: true }),
  ]);

  const program = programRes.data?.program as GeneratedProgram | null;
  const todayLogs = (foodTodayRes.data ?? []).map((row) => ({
    meal_type: row.meal_type,
    items: row.items as { food: string; amount: string; calories: number; protein: number }[],
    total_calories: Number(row.total_calories),
    total_protein: Number(row.total_protein),
  }));

  const todayTotals = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.total_calories,
      protein: acc.protein + l.total_protein,
    }),
    { calories: 0, protein: 0 }
  );

  try {
    const aiResponse = await generateGeminiJson<JournalAiResponse>(
      buildJournalPrompt({
        message,
        program,
        todayLogs,
        todayTotals,
        nickname: profileRes.data?.nickname?.trim() || "friend",
      })
    );

    if (aiResponse.action === "log_food") {
      const admin = createServiceRoleClient();
      const { error: insertError } = await admin.from("food_logs").insert({
        user_id: user!.id,
        log_date: date,
        meal_type: aiResponse.meal_type,
        items: aiResponse.items,
        total_calories: aiResponse.total_calories,
        total_protein: aiResponse.total_protein,
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const newTotals =
      aiResponse.action === "log_food"
        ? {
            calories: todayTotals.calories + aiResponse.total_calories,
            protein: todayTotals.protein + aiResponse.total_protein,
          }
        : todayTotals;

    return NextResponse.json({
      response: aiResponse,
      todayTotals: {
        calories: Math.round(newTotals.calories),
        protein: Math.round(newTotals.protein * 10) / 10,
      },
      calorieTarget: program?.calorie_target ?? 1700,
      proteinTarget: program?.protein_target_g ?? 120,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Journal request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
