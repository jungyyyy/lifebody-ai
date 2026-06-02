import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { routing, type Locale } from "./routing";

function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "de" || value === "ko";
}

function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return routing.defaultLocale;
  const parts = header.split(",").map((p) => p.split(";")[0]?.trim().toLowerCase());
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("de")) return "de";
    if (part.startsWith("ko")) return "ko";
    if (part.startsWith("en")) return "en";
  }
  return routing.defaultLocale;
}

async function localeFromProfile(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only in RSC
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single();

  return isLocale(profile?.preferred_language)
    ? profile.preferred_language
    : null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: Locale = routing.defaultLocale;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const profileLocale = await localeFromProfile();
    if (profileLocale) {
      locale = profileLocale;
    } else {
      const headerStore = await headers();
      locale = localeFromAcceptLanguage(headerStore.get("accept-language"));
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
