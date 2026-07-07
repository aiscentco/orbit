"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the mobile drawer whenever the route changes (adjusted during
  // render, per React's guidance, rather than in an effect).
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

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
    <>
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="text-2xl leading-none text-ink/70"
        >
          ☰
        </button>
        <span className="font-heading text-lg text-brand-primary">Orbit</span>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full transform flex-col border-r border-black/5 bg-white transition-transform duration-200 md:static md:z-auto md:w-60 md:shrink-0 md:translate-x-0 md:transition-none ${
          mobileOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div>
            <span className="font-heading text-2xl text-brand-primary">Orbit</span>
            <p className="mt-1 text-xs text-ink/50">AIscent Co.</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="text-xl leading-none text-ink/50 md:hidden"
          >
            ✕
          </button>
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
    </>
  );
}
