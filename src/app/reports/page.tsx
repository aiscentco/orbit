import { getClient, getClients, getProducts, getActionsForProducts } from "@/lib/notion";
import { getAuthContext, resolveClientFilter } from "@/lib/auth";
import {
  stageCounts,
  riskByProduct,
  lateProductsByLead,
  actionCompletionRate,
  LEAD_FIELDS,
} from "@/lib/reports";
import Link from "next/link";
import { BarRow } from "@/components/bar-row";
import { RiskBadge } from "@/components/risk-badge";
import { ProgressBar } from "@/components/progress-bar";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const authCtx = await getAuthContext();
  const { client: requestedClientId } = await searchParams;
  const activeClientId = resolveClientFilter(authCtx, requestedClientId);

  let error: string | null = null;
  let activeClientName: string | null = null;
  let clientNameById = new Map<string, string>();
  let stages: ReturnType<typeof stageCounts> = [];
  let leadBreakdown: ReturnType<typeof lateProductsByLead> = {
    brandManager: [],
    formulationLead: [],
    procurementLead: [],
    regulatoryLead: [],
  };
  let lateCritical: { id: string; name: string; clientId: string | null; stage: string | null; daysUntil: number | null; level: "late" | "critical" }[] = [];
  let actionStats = { done: 0, total: 0, percent: 0 };

  try {
    if (activeClientId) {
      const client = await getClient(activeClientId);
      activeClientName = client.name;
    } else if (authCtx.status === "consultant") {
      const clients = await getClients();
      clientNameById = new Map(clients.map((c) => [c.id, c.name]));
    }

    const products = await getProducts(activeClientId || undefined);
    const visibleProducts = products.filter(
      (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
    );
    const actions = await getActionsForProducts(visibleProducts.map((p) => p.id));

    stages = stageCounts(visibleProducts);
    const risks = riskByProduct(visibleProducts);
    leadBreakdown = lateProductsByLead(visibleProducts, risks);
    actionStats = actionCompletionRate(actions);

    lateCritical = visibleProducts
      .map((p) => ({ product: p, risk: risks.get(p.id)! }))
      .filter((r) => r.risk.level === "late" || r.risk.level === "critical")
      .sort((a, b) => (a.risk.daysUntil ?? 0) - (b.risk.daysUntil ?? 0))
      .map((r) => ({
        id: r.product.id,
        name: r.product.name,
        clientId: r.product.clientId,
        stage: r.product.gateStage,
        daysUntil: r.risk.daysUntil,
        level: r.risk.level as "late" | "critical",
      }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Reports</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Not connected to Notion yet</p>
          <p className="mt-1 text-ink/70">{error}</p>
        </div>
      </div>
    );
  }

  const maxStageCount = Math.max(1, ...stages.map((s) => s.count));

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Reports</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        {activeClientName ? `Viewing ${activeClientName}'s pipeline.` : "Viewing all clients."}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-black/5 p-5">
          <h2 className="font-heading text-lg text-ink">Products by stage</h2>
          <div className="mt-4 flex flex-col gap-3">
            {stages.every((s) => s.count === 0) ? (
              <p className="text-sm text-ink/50">No active products to show.</p>
            ) : (
              stages.map((s) => (
                <BarRow
                  key={s.stage}
                  label={s.stage}
                  count={s.count}
                  max={maxStageCount}
                  color="var(--brand-primary)"
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-card border border-black/5 p-5">
          <h2 className="font-heading text-lg text-ink">Action completion rate</h2>
          <div className="mt-4">
            <p className="font-heading text-4xl text-ink">{actionStats.percent}%</p>
            <p className="mt-1 text-sm text-ink/60">
              {actionStats.done} of {actionStats.total} actions completed
            </p>
            <div className="mt-3">
              <ProgressBar percent={actionStats.percent} />
            </div>
          </div>
        </section>

        <section className="rounded-card border border-black/5 p-5 lg:col-span-2">
          <h2 className="font-heading text-lg text-ink">Late products by lead</h2>
          <p className="mt-1 text-sm text-ink/60">
            Who owns each late or critical product, broken out by role.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LEAD_FIELDS.map(({ field, label, color }) => {
              const rows = leadBreakdown[field];
              const max = Math.max(1, ...rows.map((r) => r.count));
              return (
                <div key={field}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <h3 className="text-sm font-medium text-ink">{label}</h3>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {rows.length === 0 ? (
                      <p className="text-xs text-ink/40">Nothing late.</p>
                    ) : (
                      rows.map((r) => (
                        <BarRow key={r.name} label={r.name} count={r.count} max={max} color={color} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-black/5 p-5 lg:col-span-2">
          <h2 className="font-heading text-lg text-ink">Late &amp; critical list</h2>
          <div className="mt-4 flex flex-col gap-2">
            {lateCritical.length === 0 ? (
              <p className="text-sm text-ink/50">Nothing late or critical right now.</p>
            ) : (
              lateCritical.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2 hover:border-brand-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="mt-0.5 text-xs text-ink/60">
                      {p.stage ?? "—"}
                      {!activeClientName && p.clientId && clientNameById.get(p.clientId)
                        ? ` · ${clientNameById.get(p.clientId)}`
                        : ""}
                      {p.daysUntil !== null ? ` · ${-p.daysUntil}d late` : ""}
                    </p>
                  </div>
                  <RiskBadge risk={{ level: p.level, label: p.level === "critical" ? "Critical" : "Late", daysUntil: p.daysUntil }} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
