"use client";

import { useMemo, useState, useTransition } from "react";
import type { Client, Product, Action, GateStage } from "@/lib/notion";
import { GATE_STAGES } from "@/lib/notion";
import { computeRisk } from "@/lib/gates";
import { buildAgenda, type AgendaBlock } from "@/lib/agenda";
import { RiskBadge } from "@/components/risk-badge";

function latestActionByProduct(actions: Action[]): Map<string, string> {
  const byProduct = new Map<string, Action[]>();
  for (const action of actions) {
    if (!action.productId) continue;
    const list = byProduct.get(action.productId) ?? [];
    list.push(action);
    byProduct.set(action.productId, list);
  }
  const result = new Map<string, string>();
  for (const [productId, list] of byProduct) {
    const sorted = [...list].sort((a, b) => (b.dateLogged ?? "").localeCompare(a.dateLogged ?? ""));
    if (sorted[0]) result.set(productId, sorted[0].note);
  }
  return result;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function AgendaBuilder({
  client,
  products,
  actions,
}: {
  client: Client;
  products: Product[];
  actions: Action[];
}) {
  const [selectedStages, setSelectedStages] = useState<Set<GateStage>>(new Set(GATE_STAGES));
  const [startTime, setStartTime] = useState("09:00");
  const [lunchTime, setLunchTime] = useState("12:00");
  const [agenda, setAgenda] = useState<AgendaBlock[] | null>(null);
  const [contextNotes, setContextNotes] = useState<Map<string, string>>(new Map());
  const [isBuilding, startBuild] = useTransition();

  const latestActions = useMemo(() => latestActionByProduct(actions), [actions]);

  function toggleStage(stage: GateStage) {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  }

  function handleBuild() {
    const productsByStage = new Map<GateStage, Product[]>();
    for (const product of products) {
      if (!product.gateStage || !selectedStages.has(product.gateStage)) continue;
      const list = productsByStage.get(product.gateStage) ?? [];
      list.push(product);
      productsByStage.set(product.gateStage, list);
    }
    const blocks = buildAgenda(
      GATE_STAGES.filter((s) => selectedStages.has(s)),
      productsByStage,
      { startMinutes: timeToMinutes(startTime), lunchAroundMinutes: timeToMinutes(lunchTime) }
    );
    setAgenda(blocks);

    const productBlocks = blocks.filter((b) => b.type === "product" && b.product);
    if (productBlocks.length === 0) {
      setContextNotes(new Map());
      return;
    }

    startBuild(async () => {
      try {
        const res = await fetch("/api/agenda/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: productBlocks.map((b) => ({
              name: b.product!.name,
              stage: b.product!.gateStage ?? "",
              risk: computeRisk(b.product!.nextGateDate).label,
              latestAction: latestActions.get(b.product!.id) ?? null,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "AI request failed.");

        const next = new Map<string, string>();
        productBlocks.forEach((b, i) => {
          if (data.notes[i]) next.set(b.product!.id, data.notes[i]);
        });
        setContextNotes(next);
      } catch (err) {
        // The schedule itself is already built and shown - context notes are a
        // nice-to-have layer on top, so a failure here stays quiet rather than
        // blocking or alarming the reader. Logged for whoever's debugging.
        console.error("Agenda context notes unavailable:", err);
        setContextNotes(new Map());
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {GATE_STAGES.map((stage) => {
          const active = selectedStages.has(stage);
          return (
            <button
              key={stage}
              onClick={() => toggleStage(stage)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-brand-primary text-white" : "bg-petal text-ink/50 hover:bg-brand-accent/15"
              }`}
            >
              {stage}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Meeting start</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Lunch around</span>
          <input
            type="time"
            value={lunchTime}
            onChange={(e) => setLunchTime(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
          />
        </label>
        <button
          onClick={handleBuild}
          disabled={isBuilding}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isBuilding ? "Building…" : "Build agenda"}
        </button>
      </div>

      {agenda && (
        <div className="mt-6 overflow-hidden rounded-card border border-black/5">
          <div className="bg-brand-primary px-6 py-5 text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">Gate Meeting Agenda</p>
            <h2 className="mt-1 font-heading text-2xl">{client.name}</h2>
            <p className="mt-1 text-sm text-white/80">
              {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex flex-col divide-y divide-black/5">
            {agenda.map((block, i) => {
              if (block.type === "stage-header") {
                return (
                  <div key={i} className="bg-petal/40 px-6 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{block.label}</p>
                  </div>
                );
              }

              const note = block.product ? contextNotes.get(block.product.id) : undefined;

              return (
                <div key={i} className="flex items-start gap-4 px-6 py-3">
                  <div className="w-24 shrink-0 text-xs text-ink/40">
                    {block.start}–{block.end}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-base text-ink">{block.label}</p>
                      {block.isLate && <RiskBadge risk={computeRisk(block.product?.nextGateDate ?? null)} />}
                    </div>
                    {note && <p className="mt-1 text-sm text-ink/60">{note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
