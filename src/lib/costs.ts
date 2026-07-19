export type CostVarianceLevel = "under" | "on-target" | "over" | "unknown";

export type CostVariance = {
  level: CostVarianceLevel;
  pct: number | null;
};

export const COST_VARIANCE_COLORS: Record<CostVarianceLevel, string> = {
  under: "#1f9d55",
  "on-target": "#64748b",
  over: "#dc2626",
  unknown: "#94a3b8",
};

// Within 5% of target counts as "on target" rather than flagging normal
// quote-to-quote noise as an overage.
const ON_TARGET_BAND_PCT = 5;

export function costVariance(target: number | null, actual: number | null): CostVariance {
  if (target === null || target <= 0 || actual === null) return { level: "unknown", pct: null };
  const pct = ((actual - target) / target) * 100;
  if (pct > ON_TARGET_BAND_PCT) return { level: "over", pct };
  if (pct < -ON_TARGET_BAND_PCT) return { level: "under", pct };
  return { level: "on-target", pct };
}

// Best current estimate of "actual" cost for a product: the Final cost once
// it's set (the real number), otherwise the Quoted cost as the best guess
// available so far.
export function bestActualCost(quotedCost: number | null, finalCost: number | null): number | null {
  return finalCost ?? quotedCost;
}

export type ProductCostRow = {
  productId: string;
  productName: string;
  target: number | null;
  quoted: number | null;
  final: number | null;
};

export function productsWithCostData(
  products: { id: string; name: string; targetCost: number | null; quotedCost: number | null; finalCost: number | null }[]
): ProductCostRow[] {
  return products
    .filter((p) => p.targetCost !== null || p.quotedCost !== null || p.finalCost !== null)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      target: p.targetCost,
      quoted: p.quotedCost,
      final: p.finalCost,
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}
