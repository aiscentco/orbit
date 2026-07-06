"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Action, Product, Client, ActionStatus } from "@/lib/notion";
import { cycleActionStatus } from "@/lib/actions";

const STATUS_FILTERS = ["All", "To do", "Waiting", "Done"] as const;

const STATUS_STYLES: Record<ActionStatus, string> = {
  "To do": "bg-black/5 text-ink/60",
  Waiting: "bg-status-purple/10 text-status-purple",
  Done: "bg-status-green/10 text-status-green",
};

function nextStatus(status: ActionStatus | null): ActionStatus {
  if (status === "To do") return "Waiting";
  if (status === "Waiting") return "Done";
  return "To do";
}

export function ActionsList({
  actions,
  products,
  clients,
}: {
  actions: Action[];
  products: Product[];
  clients: Client[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [items, setItems] = useState(actions);
  const [, startTransition] = useTransition();

  const productMap = new Map(products.map((p) => [p.id, p]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const filtered = items.filter((a) => filter === "All" || (a.status ?? "To do") === filter);
  const sorted = [...filtered].sort((a, b) => (b.dateLogged ?? "").localeCompare(a.dateLogged ?? ""));

  function handleCycleStatus(action: Action, e: React.MouseEvent) {
    e.stopPropagation();
    if (!action.productId) return;
    const updated = nextStatus(action.status);
    setItems((prev) => prev.map((a) => (a.id === action.id ? { ...a, status: updated } : a)));
    startTransition(async () => {
      await cycleActionStatus(action.id, action.productId!, action.status ?? "To do");
    });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f ? "bg-brand-primary text-white" : "bg-petal text-ink/50 hover:bg-brand-accent/15"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-sm text-ink/40">No actions{filter !== "All" ? ` marked ${filter}` : ""}.</p>
        )}
        {sorted.map((action) => {
          const product = action.productId ? productMap.get(action.productId) : undefined;
          const client = product?.clientId ? clientMap.get(product.clientId) : undefined;

          return (
            <div
              key={action.id}
              onClick={() => product && router.push(`/products/${product.id}`)}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-card border border-black/5 p-4 transition-colors hover:border-brand-primary/30"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink">{action.note}</p>
                <p className="mt-1 text-xs text-ink/40">
                  {product?.name ?? "Unknown product"}
                  {client ? ` · ${client.name}` : ""}
                  {action.owner ? ` · ${action.owner}` : ""}
                  {action.dateLogged ? ` · ${action.dateLogged}` : ""}
                </p>
              </div>
              <button
                onClick={(e) => handleCycleStatus(action, e)}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[action.status ?? "To do"]
                }`}
              >
                {action.status ?? "To do"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
