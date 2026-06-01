import type { OnboardingFormData } from "@/types/onboarding";
import { FieldLabel, TextArea } from "../ui";

const EXAMPLES = [
  "I have a belly but my legs are thin",
  "I'm generally overweight",
  "I'm skinny but have no muscle",
];

export function Step3BodyDescription({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  return (
    <div>
      <FieldLabel htmlFor="body-desc">Your current body</FieldLabel>
      <TextArea
        id="body-desc"
        value={data.currentBodyDescription}
        onChange={(v) => setData((d) => ({ ...d, currentBodyDescription: v }))}
        placeholder="Describe your current body shape. Be as honest as you like — this is private and helps us build your plan."
        rows={5}
      />
      <p className="mt-3 text-xs text-gray-500">Examples:</p>
      <ul className="mt-1 space-y-1">
        {EXAMPLES.map((ex) => (
          <li key={ex} className="text-xs text-gray-400 italic">
            &ldquo;{ex}&rdquo;
          </li>
        ))}
      </ul>
    </div>
  );
}
