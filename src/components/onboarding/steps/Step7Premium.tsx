import { PrimaryButton, SecondaryButton } from "../ui";

const FEATURES = [
  "Your personalized 12-week program",
  "Weekly AI-generated meal prep plans",
  "Daily food journal with AI calorie tracking",
  "Weekly assessment & advice",
  "Adaptive program that learns your habits",
];

export function Step7Premium({
  onStartTrial,
  loading,
}: {
  onStartTrial: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-3xl" aria-hidden>
          🔓
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">
          Unlock Your Full Program
        </h2>
      </div>

      <ul className="space-y-3">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="text-accent shrink-0">✅</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 pt-2">
        <PrimaryButton onClick={onStartTrial} disabled={loading}>
          {loading ? "Setting up…" : "Start 3-Day Free Trial"}
        </PrimaryButton>
        <SecondaryButton
          onClick={() => alert("Stripe checkout coming soon!")}
          disabled={loading}
        >
          Subscribe for €10/month
        </SecondaryButton>
      </div>

      <p className="text-center text-xs text-gray-500">
        Cancel anytime. No commitment.
      </p>
    </div>
  );
}
