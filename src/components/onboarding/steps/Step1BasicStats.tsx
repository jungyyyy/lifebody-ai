"use client";

import { useTranslations } from "next-intl";
import type { OnboardingFormData, Sex } from "@/types/onboarding";
import { FieldLabel, SelectInput, TextInput } from "../ui";

export function Step1BasicStats({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="nickname">{t("nicknameLabel")}</FieldLabel>
        <TextInput
          id="nickname"
          value={data.nickname}
          onChange={(v) => setData((d) => ({ ...d, nickname: v }))}
          placeholder={t("nicknamePlaceholder")}
        />
      </div>
      <div>
        <FieldLabel htmlFor="weight">{t("weightLabel")}</FieldLabel>
        <TextInput
          id="weight"
          type="number"
          value={data.currentWeightKg}
          onChange={(v) => setData((d) => ({ ...d, currentWeightKg: v }))}
          placeholder={t("weightPlaceholder")}
          min={30}
          max={300}
          step={0.1}
        />
      </div>
      <div>
        <FieldLabel htmlFor="height">{t("heightLabel")}</FieldLabel>
        <TextInput
          id="height"
          type="number"
          value={data.heightCm}
          onChange={(v) => setData((d) => ({ ...d, heightCm: v }))}
          placeholder={t("heightPlaceholder")}
          min={100}
          max={250}
        />
      </div>
      <div>
        <FieldLabel htmlFor="age">{t("ageLabel")}</FieldLabel>
        <TextInput
          id="age"
          type="number"
          value={data.age}
          onChange={(v) => setData((d) => ({ ...d, age: v }))}
          placeholder={t("agePlaceholder")}
          min={13}
          max={120}
        />
      </div>
      <div>
        <FieldLabel htmlFor="sex">{t("sexLabel")}</FieldLabel>
        <SelectInput
          id="sex"
          value={data.sex}
          onChange={(v) => setData((d) => ({ ...d, sex: v as Sex }))}
          placeholder={t("sexSelect")}
          options={[
            { value: "male", label: t("sexMale") },
            { value: "female", label: t("sexFemale") },
            { value: "prefer_not_to_say", label: t("sexPreferNot") },
          ]}
        />
      </div>
    </div>
  );
}
