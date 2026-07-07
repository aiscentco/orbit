import { getClients, getProducts, getActionsForProducts } from "@/lib/notion";
import { ActionsList } from "@/components/actions-list";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: activeClientId } = await searchParams;

  let error: string | null = null;
  let clients: Awaited<ReturnType<typeof getClients>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let actions: Awaited<ReturnType<typeof getActionsForProducts>> = [];

  try {
    clients = await getClients();
    const fetched = await getProducts(activeClientId || undefined);
    products = fetched.filter(
      (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
    );
    const fetchedActions = await getActionsForProducts(products.map((p) => p.id));
    // "History" entries (stage/decision changes) are system-generated audit
    // records, not actionable work - keep them out of the task list.
    actions = fetchedActions.filter((a) => a.source !== "History");
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Actions</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Not connected to Notion yet</p>
          <p className="mt-1 text-ink/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Actions</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        All open work across your products, in one place.
      </p>
      <ActionsList actions={actions} products={products} clients={clients} />
    </div>
  );
}
