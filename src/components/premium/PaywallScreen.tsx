"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing/constants";

const FEATURES = [
  "Your personalized program (diet + fitness + fasting)",
  "Weekly AI-generated meal prep plans with recipes",
  "Daily food journal with automatic calorie tracking",
  "Weekly AI assessment & behavioral insights",
  "4-week deep analysis every month",
  "Adaptive program that learns your habits",
];

/**
 * SANDBOX TESTING:
 * Card 4242 4242 4242 4242 | any future expiry | any CVC | any ZIP
 */
export function PaywallScreen({
  programWeeks,
  onMaybeLater,
  maybeLaterLoading = false,
  onBeforeCheckout,
}: {
  programWeeks?: number;
  onMaybeLater?: () => void;
  maybeLaterLoading?: boolean;
  onBeforeCheckout?: () => Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(withTrial = true) {
    setLoading(true);
    setError(null);
    try {
      if (onBeforeCheckout) await onBeforeCheckout();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          withTrial,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not start checkout");
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function handleMaybeLater() {
    if (onMaybeLater) {
      onMaybeLater();
      return;
    }
    router.push("/dashboard");
  }

  const subtitle =
    programWeeks != null
      ? `Your ${programWeeks}-week plan is ready. Start free for 3 days. Cancel anytime.`
      : "Start free for 3 days. Cancel anytime.";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center">
        <p className="text-3xl" aria-hidden>
          🔓
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Unlock Your Program</h1>
        <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
      </div>

      <ul className="mt-8 space-y-3">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="text-accent shrink-0">✅</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => startCheckout(true)}
          disabled={loading || maybeLaterLoading}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-background hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Redirecting to checkout…"
            : `Start 3-Day Free Trial → then ${SUBSCRIPTION_PRICE_LABEL}`}
        </button>
        <button
          type="button"
          onClick={handleMaybeLater}
          disabled={loading || maybeLaterLoading}
          className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
        >
          {maybeLaterLoading ? "Continuing…" : "Maybe later"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        No charge today. Cancel before day 3 and pay nothing.
      </p>

      {!onMaybeLater && (
        <p className="mt-6 text-center text-xs text-gray-600">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-400">
            Back to dashboard
          </Link>
        </p>
      )}
    </div>
  );
}
