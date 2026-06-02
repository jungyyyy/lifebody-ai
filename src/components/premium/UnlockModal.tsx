"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing/constants";

type UnlockVariant = "never_trial" | "trial_expired";

/**
 * SANDBOX TESTING:
 * Card 4242 4242 4242 4242 | any future expiry | any CVC | any ZIP
 */
export function UnlockModal({
  open,
  variant,
  onClose,
}: {
  open: boolean;
  variant: UnlockVariant;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<"trial" | "paid" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function safeJson<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  async function startCheckout(withTrial: boolean) {
    setLoading(withTrial ? "trial" : "paid");
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          withTrial,
        }),
      });
      const json = await safeJson<{ url?: string; error?: string }>(res);
      if (!res.ok) throw new Error(json?.error ?? "Could not start checkout");
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  if (!open) return null;

  const isNew = variant === "never_trial";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
      >
        <h2 id="unlock-title" className="text-xl font-semibold text-white text-center">
          {isNew ? "Unlock LifeBody AI" : "Your Free Trial Has Ended"}
        </h2>
        <p className="mt-2 text-sm text-gray-400 text-center leading-relaxed">
          {isNew
            ? "Try everything free for 3 days — add a card to start your trial. You won't be charged until day 4."
            : "Subscribe to keep your personalized program and all your data."}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {isNew ? (
            <>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => startCheckout(true)}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50"
              >
                {loading === "trial" ? "Redirecting…" : "Start Free Trial →"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => startCheckout(false)}
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-white hover:border-white/20 disabled:opacity-50"
              >
                {loading === "paid"
                  ? "Redirecting…"
                  : `Add payment method (${SUBSCRIPTION_PRICE_LABEL})`}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => startCheckout(false)}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-background hover:bg-accent/90 disabled:opacity-50"
              >
                {loading === "paid"
                  ? "Redirecting…"
                  : `Subscribe for ${SUBSCRIPTION_PRICE_LABEL} →`}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={onClose}
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-400 hover:text-white disabled:opacity-50"
              >
                Maybe later
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-500 leading-relaxed">
          {isNew
            ? `3 days free, then ${SUBSCRIPTION_PRICE_LABEL}. Cancel anytime.`
            : "Your data and program are saved. Subscribe anytime to pick up where you left off."}
        </p>
      </div>
    </div>
  );
}
