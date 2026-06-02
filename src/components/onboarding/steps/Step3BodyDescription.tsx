"use client";

import { useTranslations } from "next-intl";
import type { OnboardingFormData } from "@/types/onboarding";
import { FieldLabel, TextArea } from "../ui";

const EXAMPLE_KEYS = [
  "bodyDescExample1",
  "bodyDescExample2",
  "bodyDescExample3",
] as const;

export function Step3BodyDescription({
  data,
  setData,
}: {
  data: OnboardingFormData;
  setData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
}) {
  const t = useTranslations("onboarding");

  return (
    <div>
      <FieldLabel htmlFor="body-desc">{t("bodyDescriptionLabel")}</FieldLabel>
      <TextArea
        id="body-desc"
        value={data.currentBodyDescription}
        onChange={(v) => setData((d) => ({ ...d, currentBodyDescription: v }))}
        placeholder={t("bodyDescriptionPlaceholder")}
        rows={5}
      />
      <p className="mt-3 text-xs text-gray-500">{t("examples")}</p>
      <ul className="mt-1 space-y-1">
        {EXAMPLE_KEYS.map((key) => (
          <li key={key} className="text-xs text-gray-400 italic">
            &ldquo;{t(key)}&rdquo;
          </li>
        ))}
      </ul>
    </div>
  );
}
