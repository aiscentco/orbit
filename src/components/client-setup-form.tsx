"use client";

import { useState, useTransition } from "react";
import type { Client } from "@/lib/notion";
import { saveClientFields } from "@/lib/actions";

const DEFAULT_PRIMARY = "#FF2D7B";
const DEFAULT_ACCENT = "#FF85B3";

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
      />
    </label>
  );
}

export function ClientSetupForm({ client }: { client: Client }) {
  const [form, setForm] = useState(client);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof Client>(key: K, value: Client[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function updateLabel(key: keyof Client["labels"], value: string) {
    setForm((f) => ({ ...f, labels: { ...f.labels, [key]: value } }));
    setDirty(true);
    setSaved(false);
  }

  function updateDistribution(key: keyof Client["distribution"], value: string) {
    setForm((f) => ({ ...f, distribution: { ...f.distribution, [key]: value } }));
    setDirty(true);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const updated = await saveClientFields(client.id, {
        name: form.name,
        brandPrimaryColor: form.brandPrimaryColor,
        brandAccentColor: form.brandAccentColor,
        halalRequired: form.halalRequired,
        chinaComplianceRequired: form.chinaComplianceRequired,
        labels: form.labels,
        distribution: form.distribution,
      });
      setForm(updated);
      setDirty(false);
      setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl">
      <FieldText label="Company name" value={form.name} onChange={(v) => updateField("name", v)} />

      <h2 className="mt-8 font-heading text-lg text-ink">KPI label mappings</h2>
      <p className="mt-1 text-xs text-ink/40">
        The client&apos;s own wording for these fields — shown throughout the app instead of the generic names.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldText label="Campaign" value={form.labels.campaign ?? ""} onChange={(v) => updateLabel("campaign", v)} />
        <FieldText label="Demand" value={form.labels.demand ?? ""} onChange={(v) => updateLabel("demand", v)} />
        <FieldText
          label="Revenue KPI"
          value={form.labels.revenueKpi ?? ""}
          onChange={(v) => updateLabel("revenueKpi", v)}
        />
        <FieldText
          label="Margin KPI"
          value={form.labels.marginKpi ?? ""}
          onChange={(v) => updateLabel("marginKpi", v)}
        />
        <FieldText
          label="Planning system"
          value={form.labels.planningSystem ?? ""}
          onChange={(v) => updateLabel("planningSystem", v)}
        />
        <FieldText label="BM role" value={form.labels.bmRole ?? ""} onChange={(v) => updateLabel("bmRole", v)} />
      </div>

      <h2 className="mt-8 font-heading text-lg text-ink">Brand colours</h2>
      <p className="mt-1 text-xs text-ink/40">The app re-skins to these colours whenever this client is active.</p>
      <div className="mt-3 flex flex-wrap gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Primary</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brandPrimaryColor || DEFAULT_PRIMARY}
              onChange={(e) => updateField("brandPrimaryColor", e.target.value)}
              className="h-9 w-9 rounded border border-black/10"
            />
            <span className="text-sm text-ink/70">{form.brandPrimaryColor || DEFAULT_PRIMARY}</span>
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Accent</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brandAccentColor || DEFAULT_ACCENT}
              onChange={(e) => updateField("brandAccentColor", e.target.value)}
              className="h-9 w-9 rounded border border-black/10"
            />
            <span className="text-sm text-ink/70">{form.brandAccentColor || DEFAULT_ACCENT}</span>
          </div>
        </label>
      </div>

      <h2 className="mt-8 font-heading text-lg text-ink">Market flags</h2>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.halalRequired}
            onChange={(e) => updateField("halalRequired", e.target.checked)}
          />
          HALAL required
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.chinaComplianceRequired}
            onChange={(e) => updateField("chinaComplianceRequired", e.target.checked)}
          />
          China compliance required
        </label>
      </div>

      <h2 className="mt-8 font-heading text-lg text-ink">Gate alert recipients</h2>
      <p className="mt-1 text-xs text-ink/40">
        Who gets the daily gate-alert digest for this client, by function. Leave blank to skip a function.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldText
          label="Project Manager"
          value={form.distribution.projectManager ?? ""}
          onChange={(v) => updateDistribution("projectManager", v)}
        />
        <FieldText
          label="Marketing"
          value={form.distribution.marketing ?? ""}
          onChange={(v) => updateDistribution("marketing", v)}
        />
        <FieldText
          label="R&D"
          value={form.distribution.rnd ?? ""}
          onChange={(v) => updateDistribution("rnd", v)}
        />
        <FieldText
          label="Procurement"
          value={form.distribution.procurement ?? ""}
          onChange={(v) => updateDistribution("procurement", v)}
        />
        <FieldText
          label="Packaging"
          value={form.distribution.packaging ?? ""}
          onChange={(v) => updateDistribution("packaging", v)}
        />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-status-green">Saved.</span>}
      </div>
    </div>
  );
}
