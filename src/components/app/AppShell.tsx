"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { AccessState } from "@/lib/premium";
import { useAccess } from "@/components/premium/AccessContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

function useNavItems() {
  const t = useTranslations("nav");
  return [
    { href: "/dashboard", label: t("dashboard"), icon: "📊", locked: false },
    { href: "/journal", label: t("journal"), icon: "💬", locked: true },
    { href: "/program", label: t("program"), icon: "📅", locked: true },
    { href: "/progress", label: t("progress"), icon: "📈", locked: true },
    { href: "/settings", label: t("settings"), icon: "⚙️", locked: false },
  ] as const;
}

type NavItem = ReturnType<typeof useNavItems>[number];

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const { isTabLocked, openUnlockModal, accessState } = useAccess();
  const locked = item.locked && isTabLocked(item.href);

  const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    active
      ? "bg-accent/15 text-accent"
      : locked
        ? "text-gray-500 opacity-70"
        : "text-gray-400 hover:text-white hover:bg-white/5"
  }`;

  if (locked) {
    return (
      <button
        type="button"
        className={`w-full ${className}`}
        onClick={() =>
          openUnlockModal(
            accessState === "trial_expired" ? "trial_expired" : "never_trial"
          )
        }
      >
        <span aria-hidden>{item.icon}</span>
        {item.label}
        <span className="ml-auto text-xs" aria-hidden>
          🔒
        </span>
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      <span aria-hidden>{item.icon}</span>
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
  shortLabel,
}: {
  item: NavItem;
  active: boolean;
  shortLabel: string;
}) {
  const { isTabLocked, openUnlockModal, accessState } = useAccess();
  const locked = item.locked && isTabLocked(item.href);

  const className = `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
    active ? "text-accent" : locked ? "text-gray-600" : "text-gray-500"
  }`;

  if (locked) {
    return (
      <button
        type="button"
        className={className}
        onClick={() =>
          openUnlockModal(
            accessState === "trial_expired" ? "trial_expired" : "never_trial"
          )
        }
      >
        <span className="text-lg" aria-hidden>
          {item.icon}
        </span>
        <span>{shortLabel}</span>
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      <span className="text-lg" aria-hidden>
        {item.icon}
      </span>
      <span>{shortLabel}</span>
    </Link>
  );
}

export function AppShell({
  children,
  nickname,
  accessState: _accessState,
}: {
  children: React.ReactNode;
  nickname: string;
  accessState: AccessState;
}) {
  const pathname = usePathname();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const NAV = useNavItems();

  const mobileShort: Record<string, string> = {
    "/dashboard": tNav("dashboard"),
    "/journal": tNav("journal"),
    "/program": tNav("programShort"),
    "/progress": tNav("progress"),
    "/settings": tNav("settings"),
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-56 flex-col border-r border-white/10 bg-card shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
              <span aria-hidden>🌿</span>
              <span>{t("appName")}</span>
            </Link>
            <LanguageSwitcher />
          </div>
          <p className="mt-2 text-xs text-gray-500 truncate">{t("hi", { name: nickname })}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="md:hidden border-b border-white/10 bg-card px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white text-sm">
            <span aria-hidden>🌿</span>
            {t("appName")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <span className="text-xs text-gray-500">{t("hi", { name: nickname })}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-white/10 bg-card z-50">
        <div className="flex justify-around py-2">
          {NAV.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              shortLabel={mobileShort[item.href] ?? item.label.split(" ")[0]}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
