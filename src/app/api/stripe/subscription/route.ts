import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getStripe } from "@/lib/stripe";

/** Fresh subscription details from Stripe (not cached client-side). */
export async function GET() {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "is_premium, trial_ends_at, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", user!.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({
      profile,
      subscription: null,
    });
  }

  try {
    const sub = await getStripe().subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const periodEnd =
      "current_period_end" in sub && typeof sub.current_period_end === "number"
        ? sub.current_period_end
        : null;
    const nextBilling = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null;
    const trialEnd = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      profile,
      subscription: {
        status: sub.status,
        trial_end: trialEnd,
        current_period_end: nextBilling,
        cancel_at_period_end: sub.cancel_at_period_end,
      },
    });
  } catch {
    return NextResponse.json({ profile, subscription: null });
  }
}
