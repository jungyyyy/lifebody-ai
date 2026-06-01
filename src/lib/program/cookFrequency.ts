/** Max unique cooked dishes per week based on onboarding cook frequency. */
export function maxUniqueRecipesForCookFrequency(cookFrequency: string): number {
  const f = cookFrequency.toLowerCase();
  if (/every day/i.test(f)) return 7;
  if (/4-6|4–6/i.test(f)) return 5;
  if (/2-3|2–3/i.test(f)) return 4;
  if (/once/i.test(f)) return 2;
  if (/rarely|never/i.test(f)) return 2;
  return 4;
}

export function isNoCookProfile(cookFrequency: string): boolean {
  return /rarely|never/i.test(cookFrequency);
}

export function cookFrequencyGuidance(cookFrequency: string): string {
  const max = maxUniqueRecipesForCookFrequency(cookFrequency);
  if (isNoCookProfile(cookFrequency)) {
    return `User rarely/never cooks. Maximum ${max} recipes — no-cook only (yogurt, deli meat, rotisserie chicken, pre-made salads, canned tuna, protein bars). No stove/oven recipes.`;
  }
  if (/every day/i.test(cookFrequency)) {
    return `User cooks daily — up to ${max} unique dishes allowed if needed.`;
  }
  if (/4-6|4–6/i.test(cookFrequency)) {
    return `User cooks 4-6x/week — maximum ${max} unique dishes.`;
  }
  if (/once/i.test(cookFrequency)) {
    return `User cooks once a week — maximum ${max} unique dishes (batch cook everything on Sunday).`;
  }
  return `User cooks 2-3x/week — MEAL PREP MODE: maximum ${max} unique dishes total. Two prep sessions (Set A Mon-Wed, Set B Thu-Sun). Same lunch & dinner dish per set is encouraged.`;
}
