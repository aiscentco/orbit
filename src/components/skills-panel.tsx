"use client";

import { useState, useTransition } from "react";
import type { Action, GateStage } from "@/lib/notion";
import { skillsForStage, FUNCTION_COLORS, type Skill } from "@/lib/skills";
import { launchSkill } from "@/lib/actions";

export function SkillsPanel({
  gateStage,
  productId,
  onLaunched,
}: {
  gateStage: GateStage | null;
  productId: string;
  onLaunched: (action: Action) => void;
}) {
  const skills = skillsForStage(gateStage);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLaunch(skill: Skill) {
    setPendingSkillId(skill.id);
    startTransition(async () => {
      try {
        const action = await launchSkill(productId, skill.name);
        onLaunched(action);
        if (skill.url) {
          window.open(skill.url, "_blank", "noopener,noreferrer");
        }
      } finally {
        setPendingSkillId(null);
      }
    });
  }

  return (
    <div className="rounded-card border border-black/5 p-4">
      <h2 className="font-heading text-lg text-ink">Skills</h2>
      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-ink/40">No skills mapped to this gate stage.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: FUNCTION_COLORS[skill.function] }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{skill.name}</p>
                  <p className="text-xs text-ink/40">{skill.function}</p>
                </div>
              </div>
              {skill.built ? (
                <button
                  onClick={() => handleLaunch(skill)}
                  disabled={isPending && pendingSkillId === skill.id}
                  className="shrink-0 rounded-lg bg-brand-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  {isPending && pendingSkillId === skill.id ? "Launching…" : "Launch"}
                </button>
              ) : (
                <span className="shrink-0 rounded-lg bg-black/5 px-3 py-1 text-xs font-medium text-ink/40">
                  Soon
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
