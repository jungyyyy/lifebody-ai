import { routing, type Locale } from "@/i18n/routing";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (routing.locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return routing.defaultLocale;
}

/** Path without locale prefix, e.g. /en/dashboard → /dashboard */
export function pathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    routing.locales.includes(segments[0] as Locale)
  ) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

export function withLocalePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
