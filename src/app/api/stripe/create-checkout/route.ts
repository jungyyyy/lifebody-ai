import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing/constants";
import { computeTrialEndsAt } from "@/lib/premium";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppOrigin, getStripe } from "@/lib/stripe";

/**
 * SANDBOX TESTING:
 * Card 4242 4242 4242 4242 | any future expiry | any CVC | any ZIP
 */
export async function POST(request: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID is not configured" },
        { status: 500 }
      );
    }
    if (!priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID must be a Stripe price id (price_...), not prod_..." },
        { status: 500 }
      );
    }

    let body: {
      userEmail?: string;
      userId?: string;
      withTrial?: boolean;
    } = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userId = body.userId ?? user!.id;
    if (userId !== user!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const withTrial = body.withTrial !== false;
    const userEmail = body.userEmail ?? user!.email ?? undefined;
    const origin = getAppOrigin(request);
    const stripe = getStripe();

    if (withTrial) {
      const admin = createServiceRoleClient();
      await admin
        .from("profiles")
        .update({
          trial_ends_at: computeTrialEndsAt(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        ...(withTrial ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
        metadata: { userId },
      },
      customer_email: userEmail,
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId, withTrial: withTrial ? "true" : "false" },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
