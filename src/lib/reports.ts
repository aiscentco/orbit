import { GATE_STAGES, type GateStage, type Product, type Action } from "@/lib/notion";
import { computeRisk, type Risk } from "@/lib/gates";

// Pure aggregation logic for the Reports page - kept separate from data
// fetching/rendering so it can be unit-reasoned-about (and reused) on its own.

export type LeadField =
  | "brandManager"
  | "formulationLead"
  | "procurementLead"
  | "regulatoryLead";

export const LEAD_FIELDS: { field: LeadField; label: string; color: string }[] = [
  { field: "brandManager", label: "Brand manager", color: "#FF2D7B" },
  { field: "formulationLead", label: "Formulation lead", color: "#5DCAA5" },
  { field: "procurementLead", label: "Procurement lead", color: "#EF9F27" },
  { field: "regulatoryLead", label: "Regulatory lead", color: "#AFA9EC" },
];

export function stageCounts(products: Product[]): { stage: GateStage; count: number }[] {
  return GATE_STAGES.map((stage) => ({
    stage,
    count: products.filter((p) => p.gateStage === stage).length,
  }));
}

export function riskByProduct(products: Product[]): Map<string, Risk> {
  return new Map(products.map((p) => [p.id, computeRisk(p.nextGateDate)]));
}

export function lateProductsByLead(
  products: Product[],
  risks: Map<string, Risk>
): Record<LeadField, { name: string; count: number }[]> {
  const result = {} as Record<LeadField, { name: string; count: number }[]>;

  for (const { field } of LEAD_FIELDS) {
    const tally = new Map<string, number>();
    for (const product of products) {
      const risk = risks.get(product.id);
      if (!risk || (risk.level !== "late" && risk.level !== "critical")) continue;
      const name = product[field];
      if (!name) continue;
      tally.set(name, (tally.get(name) ?? 0) + 1);
    }
    result[field] = [...tally.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  return result;
}

export function actionCompletionRate(actions: Action[]): {
  done: number;
  total: number;
  percent: number;
} {
  // "History" entries are system-generated audit records, not real work items.
  const relevant = actions.filter((a) => a.source !== "History");
  const done = relevant.filter((a) => a.status === "Done").length;
  const total = relevant.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
