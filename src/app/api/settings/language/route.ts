import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { locales, type Locale } from "@/i18n/routing";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single();

  const lang = isLocale(profile?.preferred_language)
    ? profile.preferred_language
    : "en";

  return NextResponse.json({ preferred_language: lang });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const lang = body.preferred_language;

  if (!isLocale(lang)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: lang })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ preferred_language: lang });
  response.cookies.set("NEXT_LOCALE", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
