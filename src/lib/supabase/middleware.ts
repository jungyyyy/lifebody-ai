import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getLocaleFromPathname,
  pathnameWithoutLocale,
  withLocalePath,
} from "@/lib/i18n/pathname";
import type { Locale } from "@/i18n/routing";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
];

function isPublicPath(pathWithoutLocale: string) {
  return PUBLIC_PATHS.some(
    (route) =>
      pathWithoutLocale === route ||
      pathWithoutLocale.startsWith(`${route}/`)
  );
}

function isAuthPage(pathWithoutLocale: string) {
  return pathWithoutLocale === "/login" || pathWithoutLocale === "/signup";
}

function localizedRedirect(
  request: NextRequest,
  locale: Locale,
  path: string,
  intlResponse?: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = withLocalePath(locale, path);
  const response = NextResponse.redirect(url);
  if (intlResponse) {
    intlResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
  }
  return response;
}

export async function updateSession(
  request: NextRequest,
  intlResponse?: NextResponse
) {
  let supabaseResponse = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = intlResponse
            ? new NextResponse(intlResponse.body, intlResponse)
            : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);
  const path = pathnameWithoutLocale(pathname);

  if (!user) {
    if (!isPublicPath(path)) {
      return localizedRedirect(request, locale, "/login", intlResponse);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const onboardingCompleted = profile?.onboarding_completed === true;

  if (
    path.startsWith("/api/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/")
  ) {
    return supabaseResponse;
  }

  if (isAuthPage(path)) {
    return localizedRedirect(
      request,
      locale,
      onboardingCompleted ? "/dashboard" : "/onboarding",
      intlResponse
    );
  }

  if (!onboardingCompleted && path !== "/onboarding") {
    return localizedRedirect(request, locale, "/onboarding", intlResponse);
  }

  if (onboardingCompleted && path === "/onboarding") {
    return localizedRedirect(request, locale, "/dashboard", intlResponse);
  }

  return supabaseResponse;
}
