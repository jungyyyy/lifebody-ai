import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  const admin = createServiceRoleClient();
  const userId = user!.id;

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      console.error("[delete-account] Stripe cancel failed:", err);
    }
  }

  await admin.from("food_logs").delete().eq("user_id", userId);
  await admin.from("weight_logs").delete().eq("user_id", userId);
  await admin.from("sport_logs").delete().eq("user_id", userId);
  await admin.from("fasting_logs").delete().eq("user_id", userId);
  await admin.from("period_logs").delete().eq("user_id", userId);
  await admin.from("weekly_assessments").delete().eq("user_id", userId);
  await admin.from("four_week_analyses").delete().eq("user_id", userId);
  await admin.from("user_programs").delete().eq("user_id", userId);
  await admin.from("onboarding_data").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
