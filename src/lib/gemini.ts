const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Extract a valid model id even if .env was pasted incorrectly (e.g. key appended). */
function resolveGeminiModel(): string {
  const raw = process.env.GEMINI_MODEL?.trim();
  if (!raw) return DEFAULT_GEMINI_MODEL;

  const match = raw.match(/^(gemini-[a-z0-9][-a-z0-9.]*)/i);
  if (match) return match[1].toLowerCase();

  return DEFAULT_GEMINI_MODEL;
}

import { getLanguageInstruction } from "@/lib/i18n/languageInstruction";
import type { Locale } from "@/i18n/routing";

const GEMINI_MODEL = resolveGeminiModel();

export async function generateGeminiJson<T>(
  prompt: string,
  systemInstruction?: string,
  model?: string,
  locale?: Locale | string
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const modelId = model?.trim() || GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

  const lang = locale ?? "en";
  const langInstruction = getLanguageInstruction(lang);
  let finalPrompt = prompt;
  let finalSystem = systemInstruction;
  if (langInstruction) {
    if (systemInstruction) {
      finalSystem = `${systemInstruction}\n\n${langInstruction}`;
    } else {
      finalPrompt = `${prompt}\n\n${langInstruction}`;
    }
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  };

  if (finalSystem) {
    body.systemInstruction = {
      parts: [{ text: finalSystem }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    throw new Error("Empty response from Gemini");
  }

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("Failed to parse Gemini JSON response");
  }
}
