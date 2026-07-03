import { getClients, type Client } from "@/lib/notion";

export default async function DashboardPage() {
  let clients: Client[] = [];
  let connectionError: string | null = null;

  try {
    clients = await getClients();
    // Milestone 1 connection check: confirms the app can read from Notion.
    console.log(`[Notion] loaded ${clients.length} client(s):`, clients);
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

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Dashboard</h1>
      <p className="mt-2 text-sm text-ink/60">
        Connected to Notion. Found {clients.length} client
        {clients.length === 1 ? "" : "s"}. Check the terminal running{" "}
        <code className="rounded bg-petal px-1.5 py-0.5">npm run dev</code> to
        see the full list logged.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {clients.map((c) => (
          <li
            key={c.id}
            className="rounded-card border border-black/5 px-4 py-3 text-sm"
          >
            {c.name || "(untitled client)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
