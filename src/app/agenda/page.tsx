import { getClient, getProducts, getActionsForProducts } from "@/lib/notion";
import { AgendaBuilder } from "@/components/agenda-builder";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: activeClientId } = await searchParams;

  if (!activeClientId) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Agenda</h1>
        <p className="mt-2 text-sm text-ink/60">
          Select a client from the sidebar to build their gate meeting agenda.
        </p>
      </div>
    );
  }

  let error: string | null = null;
  let client = null;
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let actions: Awaited<ReturnType<typeof getActionsForProducts>> = [];

  try {
    client = await getClient(activeClientId);
    const fetched = await getProducts(activeClientId);
    products = fetched.filter(
      (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
    );
    actions = await getActionsForProducts(products.map((p) => p.id));
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Agenda</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Couldn&apos;t load this client</p>
          <p className="mt-1 text-ink/70">{error ?? "Client not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Agenda</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        Pick which gate stages are on today&apos;s agenda, then build a timed meeting schedule.
      </p>
      <AgendaBuilder client={client} products={products} actions={actions} />
    </div>
  );
}
