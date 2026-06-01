"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthButton, AuthMessage } from "@/components/AuthCard";

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        goal: goal.trim() || null,
      })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold text-white">
          <span aria-hidden>🌿</span>
          <span>LifeBody AI</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-8">
          <h1 className="text-2xl font-semibold text-white">
            Let&apos;s get to know you
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            A quick setup so your AI coach can personalize your program.
          </p>

          <form onSubmit={handleComplete} className="mt-6 space-y-4">
            {error && <AuthMessage type="error">{error}</AuthMessage>}

            <div>
              <label
                htmlFor="goal"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                What&apos;s your primary goal?
              </label>
              <textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="e.g. Lose 15 lbs, build muscle, eat healthier…"
                className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white placeholder:text-gray-500 resize-none"
              />
            </div>

            <AuthButton disabled={loading}>
              {loading ? "Saving…" : "Complete setup"}
            </AuthButton>
          </form>
        </div>
      </div>
    </div>
  );
}
