export function OnboardingProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const percent = Math.round((step / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Step {step} of {total}
        </span>
        <span className="text-accent font-medium">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
