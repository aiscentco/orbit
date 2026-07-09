import { getClients, getClient } from "@/lib/notion";
import { NewProductForm } from "@/components/new-product-form";
import { getAuthContext } from "@/lib/auth";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const authCtx = await getAuthContext();
  const { client } = await searchParams;

  let clients: Awaited<ReturnType<typeof getClients>> = [];
  let error: string | null = null;

  try {
    // Client-role users can only ever create a product for their own
    // client - they never see or can pick any other client here.
    if (authCtx.status === "client") {
      clients = [await getClient(authCtx.clientId)];
    } else {
      clients = await getClients();
    }
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

  const defaultClientId = authCtx.status === "client" ? authCtx.clientId : client;

  return <NewProductForm clients={clients} defaultClientId={defaultClientId} />;
}
