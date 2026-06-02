import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "de" || value === "ko";
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
