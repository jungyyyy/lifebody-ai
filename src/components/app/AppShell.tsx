"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccessState } from "@/lib/premium";
import { useAccess } from "@/components/premium/AccessContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", locked: false },
  { href: "/journal", label: "Journal", icon: "💬", locked: true },
  { href: "/program", label: "My Program", icon: "📅", locked: true },
  { href: "/progress", label: "Progress", icon: "📈", locked: true },
  { href: "/settings", label: "Settings", icon: "⚙️", locked: false },
];

function NavLink({
  item,
  active,
}: {
  item: (typeof NAV)[0];
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
}: {
  item: (typeof NAV)[0];
  active: boolean;
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
        <span>{item.label.split(" ")[0]}</span>
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      <span className="text-lg" aria-hidden>
        {item.icon}
      </span>
      <span>{item.label.split(" ")[0]}</span>
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

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-56 flex-col border-r border-white/10 bg-card shrink-0">
        <div className="p-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
            <span aria-hidden>🌿</span>
            <span>LifeBody AI</span>
          </Link>
          <p className="mt-2 text-xs text-gray-500 truncate">Hi, {nickname}</p>
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
        <header className="md:hidden border-b border-white/10 bg-card px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white text-sm">
            <span aria-hidden>🌿</span>
            LifeBody AI
          </Link>
          <span className="text-xs text-gray-500">Hi, {nickname}</span>
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
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
