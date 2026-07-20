import {
  getClient,
  getProducts,
  getActionsForProducts,
  type Client,
  type Product,
} from "@/lib/notion";
import { computeRisk, riskRank, STAGE_PROGRESS, type Risk } from "@/lib/gates";
import { ProgressRing } from "@/components/progress-ring";
import { RiskBadge } from "@/components/risk-badge";
import { getAuthContext, resolveClientFilter } from "@/lib/auth";
import { OrbitAssistant } from "@/components/orbit-assistant";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-black/5 p-4">
      <p className="font-heading text-3xl text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink/60">{label}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const authCtx = await getAuthContext();
  const { client: requestedClientId } = await searchParams;
  const activeClientId = resolveClientFilter(authCtx, requestedClientId);

  let activeClient: Client | null = null;
  let ranked: { product: Product; risk: Risk }[] = [];
  let openActionsCount = 0;
  let connectionError: string | null = null;

  try {
    if (activeClientId) activeClient = await getClient(activeClientId);
    const products = await getProducts(activeClientId || undefined);
    const visibleProducts = products.filter(
      (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
    );
    const actions = await getActionsForProducts(visibleProducts.map((p) => p.id));
    openActionsCount = actions.filter((a) => a.status !== "Done").length;

    ranked = visibleProducts
      .map((product) => ({ product, risk: computeRisk(product.nextGateDate) }))
      .sort(
        (a, b) =>
          riskRank(a.risk.level) - riskRank(b.risk.level) ||
          (a.risk.daysUntil ?? Infinity) - (b.risk.daysUntil ?? Infinity)
      );
  } catch (err) {
    connectionError = err instanceof Error ? err.message : "Unknown error";
  }

  if (connectionError) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Dashboard</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Not connected to Notion yet</p>
          <p className="mt-1 text-ink/70">{connectionError}</p>
          <p className="mt-3 text-ink/70">
            Add a real value for <code className="rounded bg-petal px-1.5 py-0.5">NOTION_TOKEN</code> in{" "}
            <code className="rounded bg-petal px-1.5 py-0.5">.env.local</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  const bmLabel = activeClient?.labels.bmRole || "BM";

  const lateOrCritical = ranked.filter(
    (r) => r.risk.level === "late" || r.risk.level === "critical"
  ).length;
  const dueSoon = ranked.filter((r) => r.risk.level === "due-soon").length;
  const todayFocus = ranked.filter((r) => r.risk.daysUntil === 0);
  const needsAttention = ranked.filter(
    (r) => r.risk.level === "late" || r.risk.level === "critical"
  );

  return (
    <div className="p-8">
      <div className="rounded-card bg-brand-primary/10 px-6 py-5">
        <p className="font-heading text-2xl text-ink">
          {greeting(new Date().getHours())}
          {activeClient ? `, ${activeClient.name}` : ""}
        </p>
        <p className="mt-1 text-sm text-ink/60">
          {activeClient ? `Viewing ${activeClient.name}'s pipeline.` : "Viewing all clients."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="In development" value={ranked.length} />
        <StatCard label="Late / critical" value={lateOrCritical} />
        <StatCard label="Due soon" value={dueSoon} />
        <StatCard label="Open actions" value={openActionsCount} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-heading text-xl text-ink">Project health</h2>
          <div className="mt-3 flex flex-col gap-3">
            {ranked.length === 0 && (
              <p className="text-sm text-ink/50">No active products to show.</p>
            )}
            {ranked.map(({ product, risk }) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-card border border-black/5 p-4"
              >
                <ProgressRing percent={product.gateStage ? STAGE_PROGRESS[product.gateStage] : 0} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg text-ink truncate">{product.name}</p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {product.gateStage ?? "—"}
                    {product.brandManager ? ` · ${bmLabel}: ${product.brandManager}` : ""}
                    {product.campaign ? ` · ${product.campaign}` : ""}
                  </p>
                </div>
                <RiskBadge risk={risk} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-card border border-black/5 p-4">
            <h3 className="font-heading text-lg text-ink">Today&apos;s focus</h3>
            <div className="mt-2 flex flex-col gap-2">
              {todayFocus.length === 0 && (
                <p className="text-sm text-ink/50">Nothing scheduled for today.</p>
              )}
              {todayFocus.map(({ product }) => (
                <p key={product.id} className="text-sm text-ink/80">
                  {product.name}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-black/5 p-4">
            <h3 className="font-heading text-lg text-ink">Needs attention</h3>
            <div className="mt-2 flex flex-col gap-2">
              {needsAttention.length === 0 && (
                <p className="text-sm text-ink/50">Nothing late or critical.</p>
              )}
              {needsAttention.map(({ product, risk }) => (
                <div key={product.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink/80 truncate">{product.name}</p>
                  <RiskBadge risk={risk} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <OrbitAssistant clientId={activeClientId ?? null} />
    </div>
  );
}
