"use client";

import { useState, useTransition } from "react";
import type { Action, ActionStatus } from "@/lib/notion";
import { createExtractedActions } from "@/lib/actions";

// Future integration point: this box currently takes pasted meeting notes.
// Once a Granola integration exists, swap the textarea for a transcript pull
// and pass its plain-text output into the same handleExtract() flow below -
// the extraction API only ever needs plain text, so nothing else changes.

export function ActionExtractor({
  productId,
  productName,
  stage,
  onExtracted,
}: {
  productId: string;
  productName: string;
  stage: string | null;
  onExtracted: (actions: Action[]) => void;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExtract() {
    if (!notes.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/actions/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName, stage: stage ?? "", notes }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Extraction failed.");

        const items: { owner?: string; note: string; status?: ActionStatus }[] = data.actions ?? [];
        if (items.length === 0) {
          setError("No action items found in those notes.");
          return;
        }

        const created = await createExtractedActions(productId, items);
        onExtracted(created);
        setNotes("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="rounded-card border border-black/5 p-4">
      <h2 className="font-heading text-lg text-ink">Paste meeting notes</h2>
      <p className="mt-1 text-xs text-ink/40">
        Paste notes from a gate meeting and Claude will pull out the action items.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste meeting notes here…"
        rows={5}
        className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-ink"
      />
      {error && <p className="mt-2 text-sm text-status-red">{error}</p>}
      <button
        onClick={handleExtract}
        disabled={isPending || !notes.trim()}
        className="mt-3 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {isPending ? "Extracting…" : "Extract actions"}
      </button>
    </div>
  );
}
