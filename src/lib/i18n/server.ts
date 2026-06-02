import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { locales, type Locale } from "@/i18n/routing";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export async function getRequestLocale(userId?: string): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  if (userId) {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", userId)
      .single();
    if (isLocale(data?.preferred_language)) return data.preferred_language;
  }

  return "en";
}
