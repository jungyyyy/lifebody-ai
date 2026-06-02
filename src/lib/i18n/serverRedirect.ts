import { redirect as nextRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { withLocalePath } from "@/lib/i18n/pathname";
import type { Locale } from "@/i18n/routing";

/** Server-side redirect that preserves the active locale prefix. */
export async function localizedRedirect(path: string) {
  const locale = (await getLocale()) as Locale;
  nextRedirect(withLocalePath(locale, path));
}
