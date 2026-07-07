"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/notion";
import { GATE_STAGES, type GateStage } from "@/lib/notion";
import { createNewProduct } from "@/lib/actions";

const LAUNCH_TYPES = ["Regular", "Super", "Mega", "Hero"] as const;

export function NewProductForm({
  clients,
  defaultClientId,
}: {
  clients: Client[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [productCode, setProductCode] = useState("");
  const [campaign, setCampaign] = useState("");
  const [launchType, setLaunchType] = useState("");
  const [gateStage, setGateStage] = useState<GateStage>("Pre-G1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId) {
      setError("Product name and client are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const created = await createNewProduct({
          name: name.trim(),
          clientId,
          productCode: productCode.trim() || undefined,
          campaign: campaign.trim() || undefined,
          launchType: launchType || undefined,
          gateStage,
        });
        router.push(`/products/${created.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-xl p-8">
      <h1 className="font-heading text-3xl text-ink">New product</h1>
      <p className="mt-1 text-sm text-ink/60">
        Creates a new product record in Notion. You can fill in the rest of the details afterward.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Product name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Client</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Product code</span>
            <input
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Campaign</span>
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Launch type</span>
            <select
              value={launchType}
              onChange={(e) => setLaunchType(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
            >
              <option value="">—</option>
              {LAUNCH_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Starting gate stage</span>
            <select
              value={gateStage}
              onChange={(e) => setGateStage(e.target.value as GateStage)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
            >
              {GATE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-status-red">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Creating…" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm text-ink/70"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
