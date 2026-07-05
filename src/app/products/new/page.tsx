import { getClients } from "@/lib/notion";
import { NewProductForm } from "@/components/new-product-form";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;

  let clients: Awaited<ReturnType<typeof getClients>> = [];
  let error: string | null = null;

  try {
    clients = await getClients();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">New product</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Not connected to Notion yet</p>
          <p className="mt-1 text-ink/70">{error}</p>
        </div>
      </div>
    );
  }

  return <NewProductForm clients={clients} defaultClientId={client} />;
}
