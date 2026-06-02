import type { Locale } from "@/i18n/routing";

/** Appended to Gemini prompts so model output matches the user's UI language. */
export function getLanguageInstruction(lang: Locale | string): string {
  switch (lang) {
    case "de":
      return "Antworte auf Deutsch. Verwende natürliche, warme Sprache.";
    case "ko":
      return "한국어로 답변해주세요. 친근하고 따뜻한 존댓말을 사용해주세요.";
    default:
      return "";
  }
}

export function appendLanguageInstruction(
  prompt: string,
  lang: Locale | string
): string {
  const instruction = getLanguageInstruction(lang);
  if (!instruction) return prompt;
  return `${prompt}\n\n${instruction}`;
}
