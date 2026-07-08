import Link from "next/link";
import { getClients, getClient } from "@/lib/notion";
import { ClientSetupForm } from "@/components/client-setup-form";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: activeClientId } = await searchParams;

  if (!activeClientId) {
    const clients = await getClients().catch(() => []);
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Setup</h1>
        <p className="mt-2 text-sm text-ink/60">Pick a client to edit their profile:</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/setup?client=${c.id}`}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-ink hover:border-brand-primary hover:text-brand-primary"
            >
              {c.name}
            </Link>
          ))}
          {clients.length === 0 && <p className="text-sm text-ink/40">No clients found yet.</p>}
        </div>
      </div>
    );
  }

  let error: string | null = null;
  let client = null;

  try {
    client = await getClient(activeClientId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-3xl text-ink">Setup</h1>
        <div className="mt-4 max-w-lg rounded-card border border-status-amber/30 bg-status-amber/10 p-4 text-sm text-ink">
          <p className="font-medium">Couldn&apos;t load this client</p>
          <p className="mt-1 text-ink/70">{error ?? "Client not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Setup</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">Editing {client.name}&apos;s profile.</p>
      <ClientSetupForm client={client} />
    </div>
  );
}
