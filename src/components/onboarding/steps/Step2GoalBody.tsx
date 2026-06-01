import { GOAL_BODY_OPTIONS, type GoalBodyType, type OnboardingFormData } from "@/types/onboarding";

export function Step2GoalBody({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {GOAL_BODY_OPTIONS.map((option) => {
        const selected = data.goalBodyType === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              setData((d) => ({ ...d, goalBodyType: option.id as GoalBodyType }))
            }
            className={`rounded-xl border p-4 text-left transition-all ${
              selected
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {option.emoji}
            </span>
            <p className="mt-2 font-medium text-white">{option.title}</p>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
