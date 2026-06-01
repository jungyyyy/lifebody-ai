import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { getAppOrigin, getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user!.id)
    .single();

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Start a subscription first." },
      { status: 400 }
    );
  }

  const origin = getAppOrigin(request);
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
