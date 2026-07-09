import { notFound } from "next/navigation";
import { getProduct, getClient, getActions } from "@/lib/notion";
import { ProductDetail } from "@/components/product-detail";
import { getAuthContext } from "@/lib/auth";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authCtx = await getAuthContext();

  let error: string | null = null;
  let product = null;

  try {
    product = await getProduct(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || !product) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Product detail</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Couldn&apos;t load this product</p>
          <p className="mt-1 text-ink/70">{error ?? "Product not found."}</p>
        </div>
      </div>
    );
  }

  // A client user can only ever open products belonging to their own
  // client - anything else doesn't exist as far as they're concerned.
  // This check must stay outside any try/catch: notFound() works by
  // throwing a special control-flow error that a catch block would
  // otherwise swallow and mis-render as a generic load failure.
  if (authCtx.status === "client" && product.clientId !== authCtx.clientId) {
    notFound();
  }

  let client = null;
  let actions: Awaited<ReturnType<typeof getActions>> = [];

  try {
    let fetchedActions: Awaited<ReturnType<typeof getActions>>;
    [client, fetchedActions] = await Promise.all([
      product.clientId ? getClient(product.clientId) : Promise.resolve(null),
      getActions(id),
    ]);
    // "History" entries (stage/decision changes) are system-generated audit
    // records, not actionable work - keep them out of the action log.
    actions = fetchedActions.filter((a) => a.source !== "History");
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Product detail</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Couldn&apos;t load this product</p>
          <p className="mt-1 text-ink/70">{error}</p>
        </div>
      </div>
    );
  }

  return <ProductDetail product={product} client={client} actions={actions} />;
}
