import type { OnboardingFormData } from "@/types/onboarding";

const OPTIONS = [
  {
    value: "0.5",
    emoji: "🐢",
    title: "Slow",
    description: "Lose ~0.5kg per week — easiest to maintain, lowest restriction",
  },
  {
    value: "0.6",
    emoji: "🚶",
    title: "Normal",
    description: "Lose ~0.6kg per week — balanced approach",
  },
  {
    value: "0.7",
    emoji: "🏃",
    title: "Fast",
    description: "Lose ~0.7kg per week — more discipline, still safe",
  },
] as const;

export function Step5LossRate({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  return (
    <div className="grid gap-3">
      {OPTIONS.map((opt) => {
        const selected = data.weeklyLossRateKg === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, weeklyLossRateKg: opt.value }))
            }
            className={`rounded-xl border p-4 text-left transition-all ${
              selected
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {opt.emoji}
            </span>
            <p className="mt-2 font-medium text-white">{opt.title}</p>
            <p className="mt-1 text-sm text-gray-400">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
