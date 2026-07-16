import type { Client, Product } from "@/lib/notion";
import { computeRisk } from "@/lib/gates";

export type AlertType = "gate-7-days" | "just-late" | "just-critical";

export type AlertItem = {
  productId: string;
  productName: string;
  type: AlertType;
  message: string;
};

const ALERT_LABELS: Record<AlertType, string> = {
  "gate-7-days": "Gate date in 7 days",
  "just-late": "Just went late",
  "just-critical": "Just crossed into critical",
};

// Each trigger fires on the exact day a product crosses a threshold, not on
// every day it remains in that state - a cron running daily should send one
// alert per transition, never a repeat nag for the same product.
export function computeAlertsForProduct(product: Product, today: Date = new Date()): AlertItem[] {
  if (!product.nextGateDate) return [];
  const { daysUntil } = computeRisk(product.nextGateDate, today);
  const alerts: AlertItem[] = [];

  if (daysUntil === 7) {
    alerts.push({
      productId: product.id,
      productName: product.name,
      type: "gate-7-days",
      message: `Gate date is 7 days away (${product.nextGateDate}).`,
    });
  }
  if (daysUntil === -1) {
    alerts.push({
      productId: product.id,
      productName: product.name,
      type: "just-late",
      message: `Just went late (gate date was ${product.nextGateDate}).`,
    });
  }
  if (daysUntil === -15) {
    alerts.push({
      productId: product.id,
      productName: product.name,
      type: "just-critical",
      message: `Crossed into critical - more than 14 days late (gate date was ${product.nextGateDate}).`,
    });
  }

  return alerts;
}

export function recipientsForClient(client: Client): string[] {
  const raw = Object.values(client.distribution).filter((v): v is string => !!v);
  const emails = raw.flatMap((v) => v.split(",").map((e) => e.trim())).filter(Boolean);
  return [...new Set(emails)];
}

export type ClientDigest = {
  client: Client;
  recipients: string[];
  items: AlertItem[];
};

export function buildDigests(
  clients: Client[],
  productsByClient: Map<string, Product[]>,
  today: Date = new Date()
): ClientDigest[] {
  const digests: ClientDigest[] = [];
  for (const client of clients) {
    const products = productsByClient.get(client.id) ?? [];
    const items = products.flatMap((p) => computeAlertsForProduct(p, today));
    if (items.length === 0) continue;
    const recipients = recipientsForClient(client);
    if (recipients.length === 0) continue;
    digests.push({ client, recipients, items });
  }
  return digests;
}

export function digestEmailHtml(digest: ClientDigest, appUrl: string): string {
  const rows = digest.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">
        <a href="${appUrl}/products/${item.productId}" style="color:#FF2D7B;text-decoration:none;font-weight:600;">${item.productName}</a>
        <div style="color:#666;font-size:13px;margin-top:2px;">${ALERT_LABELS[item.type]} - ${item.message}</div>
      </td>
    </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;color:#111;max-width:520px;">
      <h2 style="font-size:18px;">Gate alerts for ${digest.client.name}</h2>
      <p style="color:#666;font-size:13px;">${digest.items.length} item${digest.items.length === 1 ? "" : "s"} need attention today.</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>
  `;
}
