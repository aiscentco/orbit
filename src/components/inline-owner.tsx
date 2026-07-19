"use client";

import { useState } from "react";

export function InlineOwner({
  owner,
  onSave,
}: {
  owner: string | null;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(owner ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          setEditing(false);
          const trimmed = value.trim();
          if (trimmed !== (owner ?? "")) onSave(trimmed);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(owner ?? "");
            setEditing(false);
          }
        }}
        placeholder="Assign owner…"
        className="w-28 rounded border border-black/10 px-1.5 py-0.5 text-xs text-ink"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`underline decoration-dotted underline-offset-2 hover:text-brand-primary ${
        owner ? "" : "text-ink/40"
      }`}
    >
      {owner || "Unassigned"}
    </button>
  );
}
