"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product, Action, Client, ActionStatus } from "@/lib/notion";
import { GATE_STAGES, type GateStage } from "@/lib/notion";
import { computeRisk, STAGE_PROGRESS } from "@/lib/gates";
import { GateStepper } from "@/components/gate-stepper";
import { ProgressBar } from "@/components/progress-bar";
import { RiskBadge } from "@/components/risk-badge";
import { moveProductStage, saveProductFields, addProductAction, cycleActionStatus } from "@/lib/actions";

const GATE_DECISIONS = ["GO (on time)", "GO (late)", "HOLD", "POSTPONE", "CANCEL"] as const;
const LAUNCH_TYPES = ["Regular", "Super", "Mega", "Hero"] as const;
const PRODUCT_LIVES = ["New", "Limited life"] as const;
const HALAL_OPTIONS = ["Yes", "No", "N/A"] as const;
const PROJECT_STATUSES = ["Active", "On hold", "Cancelled", "Completed"] as const;

function FieldText({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
      />
    </label>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink/50">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function nextStatus(status: ActionStatus | null): ActionStatus {
  if (status === "To do") return "Waiting";
  if (status === "Waiting") return "Done";
  return "To do";
}

const STATUS_STYLES: Record<ActionStatus, string> = {
  "To do": "bg-black/5 text-ink/60",
  Waiting: "bg-status-purple/10 text-status-purple",
  Done: "bg-status-green/10 text-status-green",
};

export function ProductDetail({
  product,
  client,
  actions,
}: {
  product: Product;
  client: Client | null;
  actions: Action[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(product);
  const [form, setForm] = useState(product);
  const [dirty, setDirty] = useState(false);
  const [showShadeCount, setShowShadeCount] = useState(product.shadeCount !== null);
  const [actionList, setActionList] = useState(actions);
  const [newNote, setNewNote] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const [gatePending, startGateTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [actionPending, startActionTransition] = useTransition();

  const risk = computeRisk(current.nextGateDate);
  const stepIndex = current.gateStage ? GATE_STAGES.indexOf(current.gateStage) + 1 : 0;

  const bmLabel = client?.labels.bmRole || "Brand manager";
  const demandLabel = client?.labels.demand || "Annual demand";
  const revenueLabel = client?.labels.revenueKpi || "Revenue target";
  const marginLabel = client?.labels.marginKpi || "Margin target %";
  const campaignLabel = client?.labels.campaign || "Campaign";

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function handleGateSelect(stage: GateStage) {
    setCurrent((c) => ({ ...c, gateStage: stage }));
    setForm((f) => ({ ...f, gateStage: stage }));
    startGateTransition(async () => {
      await moveProductStage(product.id, stage);
    });
  }

  function handleSave() {
    startSaveTransition(async () => {
      const updated = await saveProductFields(product.id, form);
      setCurrent(updated);
      setForm(updated);
      setDirty(false);
    });
  }

  function handleAddAction() {
    if (!newNote.trim()) return;
    const note = newNote.trim();
    const owner = newOwner.trim() || undefined;
    setNewNote("");
    setNewOwner("");
    startActionTransition(async () => {
      const created = await addProductAction({ productId: product.id, note, owner });
      setActionList((prev) => [created, ...prev]);
    });
  }

  function handleCycleStatus(action: Action) {
    const updatedStatus = nextStatus(action.status);
    setActionList((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, status: updatedStatus } : a))
    );
    startActionTransition(async () => {
      await cycleActionStatus(action.id, product.id, action.status ?? "To do");
    });
  }

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-ink/50 hover:text-brand-primary"
      >
        ← Back
      </button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-ink/40">
            {current.productCode}
            {current.campaign ? ` · ${current.campaign}` : ""}
            {current.launchType ? ` · ${current.launchType}` : ""}
          </p>
          <h1 className="mt-1 font-heading text-3xl text-ink">{current.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge risk={risk} />
          <button
            onClick={handleSave}
            disabled={!dirty || savePending}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {savePending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1 flex items-center justify-between text-xs text-ink/50">
          <span>Step {stepIndex} of 8</span>
          {gatePending && <span>Saving…</span>}
        </div>
        <ProgressBar percent={current.gateStage ? STAGE_PROGRESS[current.gateStage] : 0} />
        <div className="mt-3">
          <GateStepper currentStage={current.gateStage} onSelect={handleGateSelect} disabled={gatePending} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg text-ink">Details</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldText label={campaignLabel} value={form.campaign ?? ""} onChange={(v) => updateField("campaign", v)} />
            <FieldSelect
              label="Launch type"
              value={form.launchType ?? ""}
              onChange={(v) => updateField("launchType", v)}
              options={LAUNCH_TYPES}
            />
            <FieldSelect
              label="Product life"
              value={form.productLife ?? ""}
              onChange={(v) => updateField("productLife", v)}
              options={PRODUCT_LIVES}
            />
            <FieldSelect
              label="Project status"
              value={form.projectStatus ?? ""}
              onChange={(v) => updateField("projectStatus", v)}
              options={PROJECT_STATUSES}
            />

            <FieldSelect
              label="Gate decision"
              value={form.gateDecision ?? ""}
              onChange={(v) => updateField("gateDecision", v)}
              options={GATE_DECISIONS}
            />
            <FieldText
              label="Next gate date"
              type="date"
              value={form.nextGateDate ?? ""}
              onChange={(v) => updateField("nextGateDate", v)}
            />

            <FieldText label={bmLabel} value={form.brandManager ?? ""} onChange={(v) => updateField("brandManager", v)} />
            <FieldText label="Formulation lead" value={form.formulationLead ?? ""} onChange={(v) => updateField("formulationLead", v)} />
            <FieldText label="Procurement lead" value={form.procurementLead ?? ""} onChange={(v) => updateField("procurementLead", v)} />
            <FieldText label="Regulatory lead" value={form.regulatoryLead ?? ""} onChange={(v) => updateField("regulatoryLead", v)} />

            <FieldText label="Intended supplier" value={form.intendedSupplier ?? ""} onChange={(v) => updateField("intendedSupplier", v)} />
            <FieldText label="Awarded supplier" value={form.awardedSupplier ?? ""} onChange={(v) => updateField("awardedSupplier", v)} />
            <FieldText label={demandLabel} value={form.annualDemand ?? ""} onChange={(v) => updateField("annualDemand", v)} />
            <FieldNumber label="MOQ" value={form.moq} onChange={(v) => updateField("moq", v)} />

            <FieldNumber label={revenueLabel} value={form.revenueTarget} onChange={(v) => updateField("revenueTarget", v)} />
            <FieldNumber label={marginLabel} value={form.marginTargetPct} onChange={(v) => updateField("marginTargetPct", v)} />

            {showShadeCount ? (
              <FieldNumber label="Shade count" value={form.shadeCount} onChange={(v) => updateField("shadeCount", v)} />
            ) : (
              <button
                type="button"
                onClick={() => setShowShadeCount(true)}
                className="self-end text-xs text-brand-primary underline"
              >
                + Add shade count
              </button>
            )}

            <FieldSelect
              label="HALAL compliant"
              value={form.halalCompliant ?? ""}
              onChange={(v) => updateField("halalCompliant", v)}
              options={HALAL_OPTIONS}
            />
            <FieldText label="Brief link" value={form.briefLink ?? ""} onChange={(v) => updateField("briefLink", v)} />
          </div>
        </div>

        <div className="rounded-card border border-black/5 p-4">
          <h2 className="font-heading text-lg text-ink">Actions</h2>

          <div className="mt-3 flex flex-col gap-2">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="New action…"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
            />
            <div className="flex gap-2">
              <input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Owner (optional)"
                className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
              />
              <button
                onClick={handleAddAction}
                disabled={actionPending || !newNote.trim()}
                className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {actionList.length === 0 && <p className="text-sm text-ink/40">No actions logged yet.</p>}
            {actionList.map((action) => (
              <div key={action.id} className="rounded-card border border-black/5 p-3">
                <p className="text-sm text-ink">{action.note}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-ink/50">
                  <span>
                    {action.owner ?? "Unassigned"}
                    {action.dateLogged ? ` · ${action.dateLogged}` : ""}
                  </span>
                  <button
                    onClick={() => handleCycleStatus(action)}
                    className={`rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[action.status ?? "To do"]}`}
                  >
                    {action.status ?? "To do"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
