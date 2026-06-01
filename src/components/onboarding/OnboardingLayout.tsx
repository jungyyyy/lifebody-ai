import { TOTAL_ONBOARDING_STEPS } from "@/types/onboarding";
import { OnboardingProgress } from "./OnboardingProgress";

export function OnboardingLayout({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold text-white sm:text-xl">
          <span aria-hidden>🌿</span>
          <span>LifeBody AI</span>
        </div>

        <OnboardingProgress step={step} total={TOTAL_ONBOARDING_STEPS} />

        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
