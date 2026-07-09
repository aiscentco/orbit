import { auth, currentUser } from "@clerk/nextjs/server";

// Roles and client linkage live in each Clerk user's public metadata, set by
// Xo via the Clerk dashboard when she invites someone:
//   { "role": "consultant" }                          - sees every client
//   { "role": "client", "clientId": "<notion-page-id>" } - sees only that one
//
// A signed-in user with no valid role/clientId is deliberately treated as
// "unconfigured" rather than defaulting to consultant access - the safer
// failure mode for a feature whose whole point is data isolation.

export type AppRole = "consultant" | "client";

export type AuthContext =
  | { status: "signed-out" }
  | { status: "unconfigured"; userId: string }
  | { status: "consultant"; userId: string }
  | { status: "client"; userId: string; clientId: string };

export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();
  if (!userId) return { status: "signed-out" };

  const user = await currentUser();
  const role = user?.publicMetadata?.role as AppRole | undefined;
  const clientId = user?.publicMetadata?.clientId as string | undefined;

  if (role === "consultant") return { status: "consultant", userId };
  if (role === "client" && clientId) return { status: "client", userId, clientId };
  return { status: "unconfigured", userId };
}

/**
 * What client should this page's data be filtered to? Consultants get
 * whatever the switcher/URL says (or none, for "all clients"). Client users
 * always get their own clientId, regardless of what's in the URL - so a
 * client user editing the ?client= query param can never see another
 * client's data.
 */
export function resolveClientFilter(ctx: AuthContext, requested?: string): string | undefined {
  if (ctx.status === "client") return ctx.clientId;
  if (ctx.status === "consultant") return requested || undefined;
  return undefined;
}

/**
 * Server Actions run outside the page-level scoping above, so each one that
 * writes to a specific client's data must check this itself - proxy.ts only
 * confirms the caller is signed in, not which client they're allowed to touch.
 * Throws if the signed-in user isn't a consultant and isn't this client.
 */
export async function assertClientAccess(clientId: string | null): Promise<void> {
  const ctx = await getAuthContext();
  if (ctx.status === "consultant") return;
  if (ctx.status === "client" && clientId === ctx.clientId) return;
  throw new Error("Not authorized to modify this client's data.");
}
