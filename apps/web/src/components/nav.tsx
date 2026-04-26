"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "./ui";

const navItems = [
  { href: "/", label: "Inbox" },
  { href: "/sources", label: "Sources" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300 text-sm font-black text-slate-950">
            S
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-100">
              Stocker
            </div>
            <div className="text-xs text-slate-400">
              Local-first intelligence inbox
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "inline-flex items-center justify-center rounded-xl bg-amber-300 px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-amber-200"
                    : "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/6 hover:text-slate-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Badge tone="info" className="hidden sm:inline-flex">
          No advice
        </Badge>
      </div>
    </header>
  );
}
