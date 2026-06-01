import {
  COOK_OPTIONS,
  EXERCISE_OPTIONS,
  MEALS_OPTIONS,
  SWEETS_OPTIONS,
  type OnboardingFormData,
} from "@/types/onboarding";
import { FieldLabel, RadioGroup, TextArea, TextInput } from "../ui";

export function Step5Lifestyle({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
      <div>
        <FieldLabel>What cuisines do you love?</FieldLabel>
        <TextInput
          id="cuisines"
          value={data.cuisines}
          onChange={(v) => setData((d) => ({ ...d, cuisines: v }))}
          placeholder="Italian, Korean, Mexican..."
        />
      </div>

      <div>
        <FieldLabel>How often do you eat sweets?</FieldLabel>
        <RadioGroup
          name="sweets"
          value={data.sweetsFrequency}
          onChange={(v) => setData((d) => ({ ...d, sweetsFrequency: v }))}
          options={SWEETS_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>What sports or movement do you enjoy?</FieldLabel>
        <TextInput
          id="sports"
          value={data.sportsEnjoyed}
          onChange={(v) => setData((d) => ({ ...d, sportsEnjoyed: v }))}
          placeholder="Dancing, yoga, walking... or type None"
        />
      </div>

      <div>
        <FieldLabel>How often do you currently exercise?</FieldLabel>
        <RadioGroup
          name="exercise"
          value={data.exerciseFrequency}
          onChange={(v) => setData((d) => ({ ...d, exerciseFrequency: v }))}
          options={EXERCISE_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>How often can you cook per week?</FieldLabel>
        <RadioGroup
          name="cook"
          value={data.cookFrequency}
          onChange={(v) => setData((d) => ({ ...d, cookFrequency: v }))}
          options={COOK_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>How many meals do you eat per day?</FieldLabel>
        <RadioGroup
          name="meals"
          value={data.mealsPerDay}
          onChange={(v) => setData((d) => ({ ...d, mealsPerDay: v }))}
          options={MEALS_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>When do you usually eat?</FieldLabel>
        <TextInput
          id="schedule"
          value={data.eatingSchedule}
          onChange={(v) => setData((d) => ({ ...d, eatingSchedule: v }))}
          placeholder="breakfast at 8am, lunch at 1pm, dinner at 7pm"
        />
      </div>

      <div>
        <FieldLabel>What snacks do you usually eat, and when?</FieldLabel>
        <TextArea
          id="snacks"
          value={data.snacks}
          onChange={(v) => setData((d) => ({ ...d, snacks: v }))}
          placeholder="e.g. chips in the evening, fruit mid-afternoon"
          rows={2}
        />
      </div>

      <div>
        <FieldLabel>What have you been eating recently?</FieldLabel>
        <TextArea
          id="recent"
          value={data.recentEating}
          onChange={(v) => setData((d) => ({ ...d, recentEating: v }))}
          placeholder="Tell us about a typical day of eating"
          rows={3}
        />
      </div>

      <div>
        <FieldLabel>
          Dietary restrictions, allergies, medications or health conditions{" "}
          <span className="text-gray-500 font-normal">(optional)</span>
        </FieldLabel>
        <TextArea
          id="restrictions"
          value={data.dietaryRestrictions}
          onChange={(v) => setData((d) => ({ ...d, dietaryRestrictions: v }))}
          placeholder="Leave blank if none"
          rows={2}
        />
      </div>
    </div>
  );
}
