import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { NewClientForm } from "@/components/new-client-form";

export default async function NewClientPage() {
  const authCtx = await getAuthContext();
  // Only a consultant can create clients - a client-role user has no reason
  // to know this route exists.
  if (authCtx.status !== "consultant") notFound();

  return <NewClientForm />;
}
