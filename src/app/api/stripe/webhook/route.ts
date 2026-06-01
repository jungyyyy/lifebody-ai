import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * App Router: read raw body via request.text() for signature verification.
 * (Pages Router used export const config = { api: { bodyParser: false } })
 *
 * SANDBOX TESTING:
 * Card 4242 4242 4242 4242 | any future expiry | any CVC | any ZIP
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured yet" },
      { status: 503 }
    );
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.trial_will_end":
        console.info(
          "[stripe webhook] trial_will_end",
          (event.data.object as Stripe.Subscription).id
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[stripe webhook] checkout.session.completed missing userId metadata");
    return;
  }

  const stripe = getStripe();
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const withTrial = session.metadata?.withTrial !== "false";

  let trialEndsAt: string | null = null;
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (withTrial && sub.trial_end) {
      trialEndsAt = new Date(sub.trial_end * 1000).toISOString();
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_premium: true,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      trial_ends_at: trialEndsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const admin = createAdminClient();

  const updates = {
    is_premium: false,
    stripe_subscription_id: null,
    trial_ends_at: null,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    await admin.from("profiles").update(updates).eq("id", userId);
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId) {
    await admin.from("profiles").update(updates).eq("stripe_customer_id", customerId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const active =
    subscription.status === "active" || subscription.status === "trialing";

  const trialEndsAt =
    subscription.status === "trialing" && subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

  const admin = createAdminClient();
  const updates = {
    is_premium: active,
    trial_ends_at: active ? trialEndsAt : null,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };

  const userId = subscription.metadata?.userId;
  if (userId) {
    await admin.from("profiles").update(updates).eq("id", userId);
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId) {
    await admin
      .from("profiles")
      .update(updates)
      .eq("stripe_customer_id", customerId);
  }
}
