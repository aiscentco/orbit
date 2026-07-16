import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getClients, getProducts, type Product } from "@/lib/notion";
import { buildDigests, digestEmailHtml } from "@/lib/alerts";

// Vercel Cron calls this on a schedule (see vercel.json). Protected by
// CRON_SECRET so it can't be triggered by anyone who finds the URL - Vercel
// automatically sends it as a Bearer token for scheduled invocations, and we
// use the same header to trigger it manually for local testing.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY is not set in .env.local." }, { status: 500 });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const fromEmail = process.env.ALERTS_FROM_EMAIL || "Orbit <onboarding@resend.dev>";
  const resend = new Resend(process.env.RESEND_API_KEY);

  const clients = await getClients();
  const products = await getProducts();
  const activeProducts = products.filter(
    (p) => p.projectStatus !== "Cancelled" && p.projectStatus !== "Completed"
  );

  const productsByClient = new Map<string, Product[]>();
  for (const product of activeProducts) {
    if (!product.clientId) continue;
    const list = productsByClient.get(product.clientId) ?? [];
    list.push(product);
    productsByClient.set(product.clientId, list);
  }

  const digests = buildDigests(clients, productsByClient);

  const sent: { client: string; recipients: string[]; items: number }[] = [];
  const errors: { client: string; error: string }[] = [];

  for (const digest of digests) {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: digest.recipients,
        subject: `Orbit gate alerts - ${digest.client.name} (${digest.items.length})`,
        html: digestEmailHtml(digest, appUrl),
      });
      if (result.error) {
        errors.push({ client: digest.client.name, error: result.error.message });
      } else {
        sent.push({ client: digest.client.name, recipients: digest.recipients, items: digest.items.length });
      }
    } catch (err) {
      errors.push({ client: digest.client.name, error: err instanceof Error ? err.message : "Send failed" });
    }
  }

  return NextResponse.json({ sent, errors, checked: activeProducts.length });
}
