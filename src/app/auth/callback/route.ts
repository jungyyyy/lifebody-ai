import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale, type Locale } from "@/i18n/routing";
import { withLocalePath } from "@/lib/i18n/pathname";

function localeFromRequest(request: Request): Locale {
  const cookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)NEXT_LOCALE=(de|ko|en)/)?.[1];
  if (cookie === "de" || cookie === "ko" || cookie === "en") {
    return cookie;
  }

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (accept.includes("de")) return "de";
  if (accept.includes("ko")) return "ko";
  return defaultLocale;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = localeFromRequest(request);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, preferred_language")
          .eq("id", user.id)
          .single();

        const profileLocale =
          profile?.preferred_language === "de" ||
          profile?.preferred_language === "ko" ||
          profile?.preferred_language === "en"
            ? profile.preferred_language
            : locale;

        const redirectPath = profile?.onboarding_completed
          ? withLocalePath(profileLocale, "/dashboard")
          : withLocalePath(profileLocale, "/onboarding");

        const response = NextResponse.redirect(`${origin}${redirectPath}`);
        response.cookies.set("NEXT_LOCALE", profileLocale, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
        return response;
      }
    }
  }

  return NextResponse.redirect(
    `${origin}${withLocalePath(locale, "/login")}?error=auth_callback_failed`
  );
}
