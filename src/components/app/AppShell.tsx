"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/journal", label: "Journal", icon: "💬" },
  { href: "/program", label: "My Program", icon: "📅" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function AppShell({
  children,
  nickname,
}: {
  children: React.ReactNode;
  nickname: string;
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
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
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
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                  active ? "text-accent" : "text-gray-500"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
