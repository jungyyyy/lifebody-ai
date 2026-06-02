"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function switchLocale(next: Locale) {
    if (next === locale || pending) return;
    setOpen(false);

    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;

    try {
      await fetch("/api/settings/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_language: next }),
      });
    } catch {
      // cookie already set for instant UI switch
    }

    startTransition(() => {
      router.replace(pathname, { locale: next });
      router.refresh();
    });
  }

  const current = localeNames[locale];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 hover:border-white/20 hover:text-white transition-colors disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("switchLanguage")}
      >
        <span aria-hidden>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="text-gray-500" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-white/10 bg-card py-1 shadow-xl"
        >
          {locales.map((code) => {
            const item = localeNames[code];
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => switchLocale(code)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span aria-hidden>{item.flag}</span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Sets locale cookie from profile after login (before navigation). */
export async function applyPreferredLanguageFromProfile(): Promise<void> {
  try {
    const res = await fetch("/api/settings/language");
    if (!res.ok) return;
    const json = await res.json();
    const lang = json.preferred_language as Locale;
    if (lang && lang !== "en") {
      document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=31536000;SameSite=Lax`;
    }
  } catch {
    // guest or network error — keep browser-detected locale
  }
}
