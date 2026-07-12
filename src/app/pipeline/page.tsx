import Link from "next/link";
import { getClient, getProducts, getActionsForProducts, type Client, type Product } from "@/lib/notion";
import { PipelineBoard } from "@/components/pipeline-board";
import { LaunchTimeline } from "@/components/launch-timeline";
import { getAuthContext, resolveClientFilter } from "@/lib/auth";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; view?: string }>;
}) {
  const authCtx = await getAuthContext();
  const { client: requestedClientId, view: requestedView } = await searchParams;
  const activeClientId = resolveClientFilter(authCtx, requestedClientId);
  const view = requestedView === "timeline" ? "timeline" : "board";

  let activeClient: Client | null = null;
  let products: Product[] = [];
  let openActionProductIds: string[] = [];
  let connectionError: string | null = null;

  try {
    if (activeClientId) activeClient = await getClient(activeClientId);
    const fetched = await getProducts(activeClientId || undefined);
    products = fetched.filter(
      (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
    );
    const actions = await getActionsForProducts(products.map((p) => p.id));
    openActionProductIds = [
      ...new Set(
        actions.filter((a) => a.status !== "Done" && a.productId).map((a) => a.productId as string)
      ),
    ];
  } catch (err) {
    connectionError = err instanceof Error ? err.message : "Unknown error";
  }

  if (connectionError) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Pipeline</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Not connected to Notion yet</p>
          <p className="mt-1 text-ink/70">{connectionError}</p>
        </div>
      </div>
    );
  }

  const bmLabel = activeClient?.labels.bmRole || "BM";

  function viewHref(v: "board" | "timeline") {
    const params = new URLSearchParams();
    if (activeClientId) params.set("client", activeClientId);
    if (v !== "board") params.set("view", v);
    const query = params.toString();
    return query ? `/pipeline?${query}` : "/pipeline";
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-ink">Pipeline</h1>
          <p className="mt-1 text-sm text-ink/60">
            {view === "board"
              ? "Drag a card to a column to move it to that stage of the gate process."
              : "Each bar runs from brief date to launch date, grouped by campaign."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-petal p-1">
            <Link
              href={viewHref("board")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === "board" ? "bg-white text-ink shadow-sm" : "text-ink/50"
              }`}
            >
              Board
            </Link>
            <Link
              href={viewHref("timeline")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                view === "timeline" ? "bg-white text-ink shadow-sm" : "text-ink/50"
              }`}
            >
              Timeline
            </Link>
          </div>
          <Link
            href={activeClientId ? `/products/new?client=${activeClientId}` : "/products/new"}
            className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white"
          >
            + New product
          </Link>
        </div>
      </div>
      <div className="mt-6">
        {view === "board" ? (
          <PipelineBoard products={products} openActionProductIds={openActionProductIds} bmLabel={bmLabel} />
        ) : (
          <LaunchTimeline products={products} />
        )}
      </div>
    </div>
  );
}
