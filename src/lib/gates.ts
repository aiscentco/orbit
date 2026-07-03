import type { GateStage } from "@/lib/notion";

export const STAGE_PROGRESS: Record<GateStage, number> = {
  "Pre-G1": 8,
  G1: 22,
  "Post-G1": 38,
  G2: 52,
  "Post-G2": 67,
  G3: 78,
  G4: 90,
  G5: 97,
};

export type RiskLevel = "on-track" | "due-soon" | "late" | "critical" | "unknown";

export type Risk = {
  level: RiskLevel;
  label: string;
  daysUntil: number | null;
};

const RISK_RANK: Record<RiskLevel, number> = {
  critical: 0,
  late: 1,
  "due-soon": 2,
  "on-track": 3,
  unknown: 4,
};

export function riskRank(level: RiskLevel): number {
  return RISK_RANK[level];
}

export const PIPELINE_COLUMNS: { name: string; stages: GateStage[] }[] = [
  { name: "Briefing", stages: ["Pre-G1", "G1"] },
  { name: "Development", stages: ["Post-G1", "G2"] },
  { name: "Review", stages: ["Post-G2", "G3", "G4"] },
  { name: "Production", stages: ["G5"] },
];

export function stageToColumn(stage: GateStage | null): string {
  if (!stage) return PIPELINE_COLUMNS[0].name;
  return PIPELINE_COLUMNS.find((c) => c.stages.includes(stage))?.name ?? PIPELINE_COLUMNS[0].name;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function computeRisk(nextGateDate: string | null, today: Date = new Date()): Risk {
  if (!nextGateDate) return { level: "unknown", label: "No date set", daysUntil: null };

  const [year, month, day] = nextGateDate.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round(
    (target.getTime() - startOfDay(today).getTime()) / 86_400_000
  );

  if (diffDays > 7) return { level: "on-track", label: "On track", daysUntil: diffDays };
  if (diffDays >= 0) return { level: "due-soon", label: "Due soon", daysUntil: diffDays };

  const daysLate = -diffDays;
  if (daysLate <= 14) return { level: "late", label: "Late", daysUntil: diffDays };
  return { level: "critical", label: "Critical", daysUntil: diffDays };
}
