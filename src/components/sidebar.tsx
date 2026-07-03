"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Client } from "@/lib/notion";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/actions", label: "Actions" },
  { href: "/agenda", label: "Agenda" },
  { href: "/reports", label: "Reports" },
  { href: "/setup", label: "Setup" },
] as const;

const DEFAULT_PRIMARY = "#FF2D7B";
const DEFAULT_ACCENT = "#FF85B3";

export function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeClientId = searchParams.get("client") ?? "";
  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", activeClient?.brandPrimaryColor || DEFAULT_PRIMARY);
    root.style.setProperty("--brand-accent", activeClient?.brandAccentColor || DEFAULT_ACCENT);
  }, [activeClient?.brandPrimaryColor, activeClient?.brandAccentColor]);

  function navHref(href: string) {
    return activeClientId ? `${href}?client=${activeClientId}` : href;
  }

  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("client", value);
    else params.delete("client");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-black/5 bg-white flex flex-col">
      <div className="px-6 py-6">
        <span className="font-heading text-2xl text-brand-primary">Orbit</span>
        <p className="text-xs text-ink/50 mt-1">AIscent Co.</p>
      </div>

      {clients.length > 0 && (
        <div className="px-3 pb-3">
          <select
            value={activeClientId}
            onChange={handleClientChange}
            className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-ink"
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={navHref(item.href)}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand-accent/15 text-brand-primary font-medium"
                  : "text-ink/70 hover:bg-brand-accent/10"
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
