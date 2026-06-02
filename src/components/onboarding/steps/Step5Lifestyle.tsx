"use client";

import { useTranslations } from "next-intl";
import {
  COOK_OPTIONS,
  EXERCISE_OPTIONS,
  MEALS_OPTIONS,
  SWEETS_OPTIONS,
  type OnboardingFormData,
} from "@/types/onboarding";
import {
  cookOptionKey,
  exerciseOptionKey,
  mealsOptionKey,
  sweetsOptionKey,
  translatedRadioOptions,
} from "@/lib/i18n/lifestyleOptions";
import { FieldLabel, RadioGroup, TextArea, TextInput } from "../ui";

export function Step5Lifestyle({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
      <div>
        <FieldLabel>{t("cuisinesLabel")}</FieldLabel>
        <TextInput
          id="cuisines"
          value={data.cuisines}
          onChange={(v) => setData((d) => ({ ...d, cuisines: v }))}
          placeholder={t("cuisinesPlaceholder")}
        />
      </div>

      <div>
        <FieldLabel>{t("sweetsLabel")}</FieldLabel>
        <RadioGroup
          name="sweets"
          value={data.sweetsFrequency}
          onChange={(v) => setData((d) => ({ ...d, sweetsFrequency: v }))}
          options={translatedRadioOptions(SWEETS_OPTIONS, sweetsOptionKey, t)}
        />
      </div>

      <div>
        <FieldLabel>{t("sportsLabel")}</FieldLabel>
        <TextInput
          id="sports"
          value={data.sportsEnjoyed}
          onChange={(v) => setData((d) => ({ ...d, sportsEnjoyed: v }))}
          placeholder={t("sportsPlaceholder")}
        />
      </div>

      <div>
        <FieldLabel>{t("exerciseLabel")}</FieldLabel>
        <RadioGroup
          name="exercise"
          value={data.exerciseFrequency}
          onChange={(v) => setData((d) => ({ ...d, exerciseFrequency: v }))}
          options={translatedRadioOptions(
            EXERCISE_OPTIONS,
            exerciseOptionKey,
            t
          )}
        />
      </div>

      <div>
        <FieldLabel>{t("cookLabel")}</FieldLabel>
        <RadioGroup
          name="cook"
          value={data.cookFrequency}
          onChange={(v) => setData((d) => ({ ...d, cookFrequency: v }))}
          options={translatedRadioOptions(COOK_OPTIONS, cookOptionKey, t)}
        />
      </div>

      <div>
        <FieldLabel>{t("mealsLabel")}</FieldLabel>
        <RadioGroup
          name="meals"
          value={data.mealsPerDay}
          onChange={(v) => setData((d) => ({ ...d, mealsPerDay: v }))}
          options={translatedRadioOptions(MEALS_OPTIONS, mealsOptionKey, t)}
        />
      </div>

      <div>
        <FieldLabel>{t("scheduleLabel")}</FieldLabel>
        <TextInput
          id="schedule"
          value={data.eatingSchedule}
          onChange={(v) => setData((d) => ({ ...d, eatingSchedule: v }))}
          placeholder={t("scheduleDetail")}
        />
      </div>

      <div>
        <FieldLabel>{t("snacksLabel")}</FieldLabel>
        <TextArea
          id="snacks"
          value={data.snacks}
          onChange={(v) => setData((d) => ({ ...d, snacks: v }))}
          placeholder={t("snacksDetail")}
          rows={2}
        />
      </div>

      <div>
        <FieldLabel>{t("recentEatingLabel")}</FieldLabel>
        <TextArea
          id="recent"
          value={data.recentEating}
          onChange={(v) => setData((d) => ({ ...d, recentEating: v }))}
          placeholder={t("recentDetail")}
          rows={3}
        />
      </div>

      <div>
        <FieldLabel>
          {t("dietaryExtended")}{" "}
          <span className="text-gray-500 font-normal">{t("optional")}</span>
        </FieldLabel>
        <TextArea
          id="restrictions"
          value={data.dietaryRestrictions}
          onChange={(v) => setData((d) => ({ ...d, dietaryRestrictions: v }))}
          placeholder={t("dietaryEmpty")}
          rows={2}
        />
      </div>
    </div>
  );
}
