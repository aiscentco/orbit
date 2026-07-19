"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Action, Product, Client, ActionStatus } from "@/lib/notion";
import { cycleActionStatus, assignActionOwner } from "@/lib/actions";
import { computeRisk, riskRank } from "@/lib/gates";
import { RiskBadge } from "@/components/risk-badge";
import { InlineOwner } from "@/components/inline-owner";
import { FUNCTION_COLORS, type SkillFunction } from "@/lib/skills";

const STATUS_FILTERS = ["All", "To do", "Waiting", "Done"] as const;
const VIEWS = ["By project", "By function"] as const;

const STATUS_STYLES: Record<ActionStatus, string> = {
  "To do": "bg-black/5 text-ink/60",
  Waiting: "bg-status-purple/10 text-status-purple",
  Done: "bg-status-green/10 text-status-green",
};

const FUNCTION_ORDER: SkillFunction[] = ["Marketing", "Procurement", "R&D", "Regulatory"];
const UNASSIGNED_COLOR = "#94a3b8";

function nextStatus(status: ActionStatus | null): ActionStatus {
  if (status === "To do") return "Waiting";
  if (status === "Waiting") return "Done";
  return "To do";
}

function normalize(name: string | null): string {
  return (name ?? "").trim().toLowerCase();
}

// An action doesn't carry a function tag directly, but its Owner is usually
// one of the product's four named leads - match on that name instead of
// guessing from the product's current stage, which can drift from who's
// actually doing the work.
function functionForAction(action: Action, product: Product | undefined): SkillFunction | "Unassigned" {
  if (!product || !action.owner) return "Unassigned";
  const owner = normalize(action.owner);
  if (owner && owner === normalize(product.brandManager)) return "Marketing";
  if (owner && owner === normalize(product.formulationLead)) return "R&D";
  if (owner && owner === normalize(product.procurementLead)) return "Procurement";
  if (owner && owner === normalize(product.regulatoryLead)) return "Regulatory";
  return "Unassigned";
}

function ActionRow({
  action,
  product,
  client,
  showProduct,
  onOpen,
  onCycleStatus,
  onAssignOwner,
}: {
  action: Action;
  product: Product | undefined;
  client: Client | undefined;
  showProduct: boolean;
  onOpen: () => void;
  onCycleStatus: (e: React.MouseEvent) => void;
  onAssignOwner: (owner: string) => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-card border border-black/5 p-4 transition-colors hover:border-brand-primary/30"
    >
      <div className="min-w-0">
        <p className="text-sm text-ink">{action.note}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink/40">
          {showProduct && (
            <span>
              {product?.name ?? "Unknown product"}
              {client ? ` · ${client.name}` : ""} ·{" "}
            </span>
          )}
          <InlineOwner owner={action.owner} onSave={onAssignOwner} />
          {action.dateLogged ? ` · ${action.dateLogged}` : ""}
        </p>
      </div>
      <button
        onClick={onCycleStatus}
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[action.status ?? "To do"]}`}
      >
        {action.status ?? "To do"}
      </button>
    </div>
  );
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
  const [view, setView] = useState<(typeof VIEWS)[number]>("By project");
  const [items, setItems] = useState(actions);
  const [, startTransition] = useTransition();

  const productMap = new Map(products.map((p) => [p.id, p]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const showClient = clients.length > 1;

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

  function handleAssignOwner(action: Action, owner: string) {
    if (!action.productId) return;
    setItems((prev) => prev.map((a) => (a.id === action.id ? { ...a, owner } : a)));
    startTransition(async () => {
      await assignActionOwner(action.id, action.productId!, owner);
    });
  }

  function renderRow(action: Action, showProduct: boolean) {
    const product = action.productId ? productMap.get(action.productId) : undefined;
    const client = product?.clientId ? clientMap.get(product.clientId) : undefined;
    return (
      <ActionRow
        key={action.id}
        action={action}
        product={product}
        client={client}
        showProduct={showProduct}
        onOpen={() => product && router.push(`/products/${product.id}`)}
        onCycleStatus={(e) => handleCycleStatus(action, e)}
        onAssignOwner={(owner) => handleAssignOwner(action, owner)}
      />
    );
  }

  let groups: { key: string; label: string; color?: string; risk?: ReturnType<typeof computeRisk>; rows: Action[] }[];

  if (view === "By project") {
    const byProduct = new Map<string, Action[]>();
    for (const action of sorted) {
      if (!action.productId) continue;
      const list = byProduct.get(action.productId) ?? [];
      list.push(action);
      byProduct.set(action.productId, list);
    }
    groups = [...byProduct.entries()]
      .map(([productId, rows]) => {
        const product = productMap.get(productId);
        const client = product?.clientId ? clientMap.get(product.clientId) : undefined;
        const risk = computeRisk(product?.nextGateDate ?? null);
        return {
          key: productId,
          label: product ? `${product.name}${showClient && client ? ` · ${client.name}` : ""}` : "Unknown product",
          risk,
          rows,
        };
      })
      .sort(
        (a, b) =>
          riskRank(a.risk!.level) - riskRank(b.risk!.level) ||
          (a.risk!.daysUntil ?? Infinity) - (b.risk!.daysUntil ?? Infinity)
      );
  } else {
    const byFunction = new Map<string, Action[]>();
    for (const action of sorted) {
      const product = action.productId ? productMap.get(action.productId) : undefined;
      const fn = functionForAction(action, product);
      const list = byFunction.get(fn) ?? [];
      list.push(action);
      byFunction.set(fn, list);
    }
    groups = [...FUNCTION_ORDER, "Unassigned" as const]
      .filter((fn) => byFunction.has(fn))
      .map((fn) => ({
        key: fn,
        label: fn,
        color: fn === "Unassigned" ? UNASSIGNED_COLOR : FUNCTION_COLORS[fn as SkillFunction],
        rows: byFunction.get(fn)!,
      }));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
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
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                view === v ? "bg-ink text-white" : "bg-petal text-ink/50 hover:bg-brand-accent/15"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-ink/40">No actions{filter !== "All" ? ` marked ${filter}` : ""}.</p>
      )}

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <details key={group.key} className="group rounded-card border border-black/5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-2">
                {group.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                    aria-hidden
                  />
                )}
                <span className="truncate text-sm font-medium text-ink">{group.label}</span>
                <span className="shrink-0 text-xs text-ink/40">({group.rows.length})</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {group.risk && (group.risk.level === "late" || group.risk.level === "critical") && (
                  <RiskBadge risk={group.risk} />
                )}
                <span className="text-xs text-ink/30 transition-transform group-open:rotate-180">▾</span>
              </div>
            </summary>
            <div className="flex flex-col gap-2 border-t border-black/5 p-3">
              {group.rows.map((action) => renderRow(action, view === "By function"))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
