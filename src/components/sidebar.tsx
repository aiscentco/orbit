"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/actions", label: "Actions" },
  { href: "/agenda", label: "Agenda" },
  { href: "/reports", label: "Reports" },
  { href: "/setup", label: "Setup" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-black/5 bg-white flex flex-col">
      <div className="px-6 py-6">
        <span className="font-heading text-2xl text-brand-primary">Orbit</span>
        <p className="text-xs text-ink/50 mt-1">AIscent Co.</p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-petal text-brand-primary font-medium"
                  : "text-ink/70 hover:bg-petal/60"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
