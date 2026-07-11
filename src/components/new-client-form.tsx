"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNewClient } from "@/lib/actions";

const CONSULTING_LEADS = ["Xo", "Lydia"] as const;
const STATUSES = ["Pilot", "Active", "Paused", "Completed"] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [consultingLead, setConsultingLead] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Pilot");
  const [engagementStart, setEngagementStart] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const created = await createNewClient({
          name: name.trim(),
          consultingLead: consultingLead || undefined,
          status,
          engagementStart,
        });
        router.push(`/setup?client=${created.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-xl p-8">
      <h1 className="font-heading text-3xl text-ink">New client</h1>
      <p className="mt-1 text-sm text-ink/60">
        Creates a new client record in Notion. You can fill in KPI labels, brand colours, and
        market flags afterward.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/50">Company name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Consulting lead</span>
            <select
              value={consultingLead}
              onChange={(e) => setConsultingLead(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
            >
              <option value="">—</option>
              {CONSULTING_LEADS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-ink"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/50">Engagement start</span>
            <input
              type="date"
              value={engagementStart}
              onChange={(e) => setEngagementStart(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-ink"
            />
          </label>
        </div>

        {error && <p className="text-sm text-status-red">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Creating…" : "Create client"}
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
