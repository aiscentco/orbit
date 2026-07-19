"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import type { Product, GateStage } from "@/lib/notion";
import { computeRisk, riskRank, PIPELINE_COLUMNS, stageToColumn, STAGE_PROGRESS } from "@/lib/gates";
import { ProgressBar } from "@/components/progress-bar";
import { RiskBadge } from "@/components/risk-badge";
import { moveProductStage } from "@/lib/actions";
import { bestActualCost, costVariance } from "@/lib/costs";

type GroupBy = "stage" | "campaign";

function sortByUrgency(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    const ra = computeRisk(a.nextGateDate);
    const rb = computeRisk(b.nextGateDate);
    return (
      riskRank(ra.level) - riskRank(rb.level) ||
      (ra.daysUntil ?? Infinity) - (rb.daysUntil ?? Infinity)
    );
  });
}

export function PipelineBoard({
  products,
  openActionProductIds,
  bmLabel,
}: {
  products: Product[];
  openActionProductIds: string[];
  bmLabel: string;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("stage");
  const [isPending, startTransition] = useTransition();
  const [items, setOptimisticStage] = useOptimistic(
    products,
    (state, update: { id: string; stage: GateStage }) =>
      state.map((p) => (p.id === update.id ? { ...p, gateStage: update.stage } : p))
  );
  const openSet = new Set(openActionProductIds);

  const columns: { name: string; products: Product[]; entryStage: GateStage | null }[] =
    groupBy === "stage"
      ? PIPELINE_COLUMNS.map((col) => ({
          name: col.name,
          products: items.filter((p) => stageToColumn(p.gateStage) === col.name),
          entryStage: col.stages[0],
        }))
      : Array.from(new Set(items.map((p) => p.campaign || "No campaign")))
          .sort()
          .map((campaign) => ({
            name: campaign,
            products: items.filter((p) => (p.campaign || "No campaign") === campaign),
            entryStage: null,
          }));

  function handleDrop(entryStage: GateStage | null, e: React.DragEvent) {
    e.preventDefault();
    if (!entryStage) return;
    const productId = e.dataTransfer.getData("text/plain");
    const product = items.find((p) => p.id === productId);
    if (!product || product.gateStage === entryStage) return;

    startTransition(async () => {
      setOptimisticStage({ id: productId, stage: entryStage });
      await moveProductStage(productId, entryStage);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex rounded-lg border border-black/10 p-0.5 text-sm">
          <button
            onClick={() => setGroupBy("stage")}
            className={`rounded-md px-3 py-1 ${
              groupBy === "stage" ? "bg-brand-accent/15 text-brand-primary font-medium" : "text-ink/60"
            }`}
          >
            By stage
          </button>
          <button
            onClick={() => setGroupBy("campaign")}
            className={`rounded-md px-3 py-1 ${
              groupBy === "campaign" ? "bg-brand-accent/15 text-brand-primary font-medium" : "text-ink/60"
            }`}
          >
            By campaign
          </button>
        </div>
        {groupBy === "campaign" && (
          <span className="text-xs text-ink/40">Switch to &quot;By stage&quot; to drag cards between stages.</span>
        )}
        {isPending && <span className="text-xs text-ink/40">Saving…</span>}
      </div>

      <div className="flex flex-wrap gap-4">
        {columns.map((col) => (
          <div
            key={col.name}
            onDragOver={(e) => groupBy === "stage" && e.preventDefault()}
            onDrop={(e) => handleDrop(col.entryStage, e)}
            className="w-full shrink-0 rounded-card bg-petal/40 p-3 sm:w-72"
          >
            <p className="mb-2 font-heading text-sm text-ink/70">
              {col.name} <span className="text-ink/40">({col.products.length})</span>
            </p>
            <div className="flex flex-col gap-2">
              {sortByUrgency(col.products).map((product) => {
                const risk = computeRisk(product.nextGateDate);
                const actualCost = bestActualCost(product.quotedCost, product.finalCost);
                const variance = costVariance(product.targetCost, actualCost);
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    draggable={groupBy === "stage"}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", product.id)}
                    className="block rounded-card border border-black/5 bg-white p-3 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-heading text-base text-ink truncate">{product.name}</p>
                        <p className="mt-0.5 text-xs text-ink/50 truncate">
                          {product.productCode}
                          {product.campaign ? ` · ${product.campaign}` : ""}
                        </p>
                      </div>
                      <div className="mt-1 flex shrink-0 items-center gap-1">
                        {variance.level === "over" && (
                          <span
                            className="text-status-red"
                            title={`Over budget by ${Math.round(variance.pct ?? 0)}%`}
                          >
                            $
                          </span>
                        )}
                        {openSet.has(product.id) && (
                          <span
                            className="h-2 w-2 rounded-full bg-brand-primary"
                            title="Has open actions"
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <ProgressBar percent={product.gateStage ? STAGE_PROGRESS[product.gateStage] : 0} />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink/60">
                        {bmLabel}: {product.brandManager ?? "—"}
                      </span>
                      <RiskBadge risk={risk} />
                    </div>

                    {product.launchType && (
                      <p className="mt-2 text-[11px] text-ink/40">{product.launchType}</p>
                    )}
                  </Link>
                );
              })}
              {col.products.length === 0 && (
                <p className="text-xs text-ink/40">No products.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
