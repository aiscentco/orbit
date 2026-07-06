import type { Product, GateStage } from "@/lib/notion";
import { computeRisk } from "@/lib/gates";

const LAUNCH_DURATIONS: Record<string, number> = {
  Regular: 15,
  Super: 20,
  Mega: 25,
  Hero: 25,
};
const DEFAULT_DURATION = 15;
const LATE_EXTRA_MINUTES = 10;
const LUNCH_DURATION_MINUTES = 45;
const WELCOME_MINUTES = 15;
const SUPPLY_PLANNING_MINUTES = 15;
const AOB_MINUTES = 10;
const CLOSE_MINUTES = 5;

export type AgendaBlockType =
  | "welcome"
  | "supply"
  | "stage-header"
  | "product"
  | "lunch"
  | "aob"
  | "close";

export type AgendaBlock = {
  type: AgendaBlockType;
  label: string;
  start: string;
  end: string;
  durationMinutes: number;
  product?: Product;
  isLate?: boolean;
};

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildAgenda(
  stagesInOrder: GateStage[],
  productsByStage: Map<GateStage, Product[]>,
  options?: { startMinutes?: number; lunchAroundMinutes?: number }
): AgendaBlock[] {
  const startMinutes = options?.startMinutes ?? 9 * 60;
  const lunchAroundMinutes = options?.lunchAroundMinutes ?? 12 * 60;

  const blocks: AgendaBlock[] = [];
  let t = startMinutes;
  let lunchInserted = false;

  function push(type: AgendaBlockType, label: string, duration: number, extra?: Partial<AgendaBlock>) {
    const start = t;
    t += duration;
    blocks.push({ type, label, start: formatTime(start), end: formatTime(t), durationMinutes: duration, ...extra });
  }

  push("welcome", "Welcome & objectives", WELCOME_MINUTES);
  push("supply", "Supply planning update", SUPPLY_PLANNING_MINUTES);

  for (const stage of stagesInOrder) {
    const products = productsByStage.get(stage) ?? [];
    if (products.length === 0) continue;

    push("stage-header", stage, 0);

    for (const product of products) {
      if (!lunchInserted && t >= lunchAroundMinutes) {
        push("lunch", "Lunch break", LUNCH_DURATION_MINUTES);
        lunchInserted = true;
      }

      const risk = computeRisk(product.nextGateDate);
      const isLate = risk.level === "late" || risk.level === "critical";
      const base = LAUNCH_DURATIONS[product.launchType ?? ""] ?? DEFAULT_DURATION;
      const duration = isLate ? base + LATE_EXTRA_MINUTES : base;

      push("product", product.name, duration, { product, isLate });
    }
  }

  // Lunch only appears if the schedule is actually still running once it
  // reaches the configured time - a short meeting that wraps up beforehand
  // shouldn't have one forced in.

  push("aob", "AOB", AOB_MINUTES);
  push("close", "Close", CLOSE_MINUTES);

  return blocks;
}
