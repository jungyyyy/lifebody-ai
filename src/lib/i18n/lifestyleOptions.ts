import {
  COOK_OPTIONS,
  EXERCISE_OPTIONS,
  MEALS_OPTIONS,
  SWEETS_OPTIONS,
} from "@/types/onboarding";

const SWEETS_KEYS: Record<(typeof SWEETS_OPTIONS)[number], string> = {
  Daily: "sweetsDaily",
  "A few times a week": "sweetsFewWeek",
  Rarely: "sweetsRarely",
  "Almost never": "sweetsAlmostNever",
};

const EXERCISE_KEYS: Record<(typeof EXERCISE_OPTIONS)[number], string> = {
  Daily: "exerciseDaily",
  "3-5x/week": "exercise3to5",
  "1-2x/week": "exercise1to2",
  Rarely: "exerciseRarely",
  Never: "exerciseNever",
};

const COOK_KEYS: Record<(typeof COOK_OPTIONS)[number], string> = {
  "Every day": "cookEveryDay",
  "4-6x": "cook4to6",
  "2-3x": "cook2to3",
  Once: "cookOnce",
  "Rarely/Never": "cookRarely",
};

const MEALS_KEYS: Record<(typeof MEALS_OPTIONS)[number], string> = {
  "1": "meals1",
  "2": "meals2",
  "3": "meals3",
  "4+": "meals4plus",
};

export function lifestyleOptionKey(
  value: string,
  map: Record<string, string>
): string {
  return map[value] ?? value;
}

export function sweetsOptionKey(value: string): string {
  return lifestyleOptionKey(value, SWEETS_KEYS);
}

export function exerciseOptionKey(value: string): string {
  return lifestyleOptionKey(value, EXERCISE_KEYS);
}

export function cookOptionKey(value: string): string {
  return lifestyleOptionKey(value, COOK_KEYS);
}

export function mealsOptionKey(value: string): string {
  return lifestyleOptionKey(value, MEALS_KEYS);
}

export function translatedRadioOptions(
  values: readonly string[],
  keyForValue: (value: string) => string,
  t: (key: string) => string
): { value: string; label: string }[] {
  return values.map((value) => ({
    value,
    label: t(keyForValue(value)),
  }));
}
