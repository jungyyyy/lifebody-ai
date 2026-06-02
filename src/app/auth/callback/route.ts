import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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

        const redirectPath = profile?.onboarding_completed
          ? "/dashboard"
          : "/onboarding";

        const response = NextResponse.redirect(`${origin}${redirectPath}`);
        const lang = profile?.preferred_language;
        if (lang === "de" || lang === "ko" || lang === "en") {
          response.cookies.set("NEXT_LOCALE", lang, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          });
        }
        return response;
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
