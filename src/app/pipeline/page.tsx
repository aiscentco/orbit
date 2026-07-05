import Link from "next/link";
import { getClients, getProducts, getActionsForProducts, type Client, type Product } from "@/lib/notion";
import { PipelineBoard } from "@/components/pipeline-board";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: activeClientId } = await searchParams;

  let clients: Client[] = [];
  let products: Product[] = [];
  let openActionProductIds: string[] = [];
  let connectionError: string | null = null;

  try {
    clients = await getClients();
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

  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;
  const bmLabel = activeClient?.labels.bmRole || "BM";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-ink">Pipeline</h1>
          <p className="mt-1 text-sm text-ink/60">
            Drag a card to a column to move it to that stage of the gate process.
          </p>
        </div>
        <Link
          href={activeClientId ? `/products/new?client=${activeClientId}` : "/products/new"}
          className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white"
        >
          + New product
        </Link>
      </div>
      <div className="mt-6">
        <PipelineBoard products={products} openActionProductIds={openActionProductIds} bmLabel={bmLabel} />
      </div>
    </div>
  );
}
