import type { OnboardingFormData, Sex } from "@/types/onboarding";
import { FieldLabel, SelectInput, TextInput } from "../ui";

export function Step1BasicStats({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="nickname">What should we call you?</FieldLabel>
        <TextInput
          id="nickname"
          value={data.nickname}
          onChange={(v) => setData((d) => ({ ...d, nickname: v }))}
          placeholder="e.g. Alex"
        />
      </div>
      <div>
        <FieldLabel htmlFor="weight">Current weight (kg)</FieldLabel>
        <TextInput
          id="weight"
          type="number"
          value={data.currentWeightKg}
          onChange={(v) => setData((d) => ({ ...d, currentWeightKg: v }))}
          placeholder="e.g. 78"
          min={30}
          max={300}
          step={0.1}
        />
      </div>
      <div>
        <FieldLabel htmlFor="height">Height (cm)</FieldLabel>
        <TextInput
          id="height"
          type="number"
          value={data.heightCm}
          onChange={(v) => setData((d) => ({ ...d, heightCm: v }))}
          placeholder="e.g. 175"
          min={100}
          max={250}
        />
      </div>
      <div>
        <FieldLabel htmlFor="age">Age</FieldLabel>
        <TextInput
          id="age"
          type="number"
          value={data.age}
          onChange={(v) => setData((d) => ({ ...d, age: v }))}
          placeholder="e.g. 32"
          min={13}
          max={120}
        />
      </div>
      <div>
        <FieldLabel htmlFor="sex">Sex</FieldLabel>
        <SelectInput
          id="sex"
          value={data.sex}
          onChange={(v) => setData((d) => ({ ...d, sex: v as Sex }))}
          placeholder="Select…"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "prefer_not_to_say", label: "Prefer not to say" },
          ]}
        />
      </div>
    </div>
  );
}
