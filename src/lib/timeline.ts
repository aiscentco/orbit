import type { Product } from "@/lib/notion";
import { computeRisk } from "@/lib/gates";

export type TimelineBar = {
  productId: string;
  productName: string;
  startPercent: number;
  endPercent: number;
  gateMarkerPercent: number | null;
  gateMarkerDate: string | null;
  gateStage: string | null;
  isLate: boolean;
};

export type TimelineCampaign = {
  campaign: string;
  bars: TimelineBar[];
};

export type TimelineTick = {
  percent: number;
  label: string;
};

export type TimelineData = {
  rangeStart: Date;
  rangeEnd: Date;
  todayPercent: number | null;
  monthTicks: TimelineTick[];
  campaigns: TimelineCampaign[];
};

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function percentBetween(date: Date, start: Date, end: Date): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / total) * 100));
}

// Steps by 1/2/3 months depending on how long the range is, so there are
// never more than ~12 labels on screen regardless of how far out it spans.
function computeMonthTicks(rangeStart: Date, rangeEnd: Date): TimelineTick[] {
  const totalMonths =
    (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 +
    (rangeEnd.getMonth() - rangeStart.getMonth()) +
    1;
  const step = totalMonths <= 12 ? 1 : totalMonths <= 24 ? 2 : 3;

  const ticks: TimelineTick[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor <= rangeEnd) {
    if (cursor >= rangeStart) {
      ticks.push({
        percent: percentBetween(cursor, rangeStart, rangeEnd),
        label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      });
    }
    cursor.setMonth(cursor.getMonth() + step);
  }
  return ticks;
}

// Products without both a Brief date and a Launch date can't draw a bar, so
// they're simply left off the timeline (hidden, not shown broken) until
// those two fields are filled in.
export function buildTimeline(products: Product[], today: Date = new Date()): TimelineData | null {
  const eligible = products.filter((p) => p.briefDate && p.launchDate);
  if (eligible.length === 0) return null;

  const starts = eligible.map((p) => parseDate(p.briefDate!).getTime());
  const ends = eligible.map((p) => parseDate(p.launchDate!).getTime());
  const rangeStart = new Date(Math.min(...starts));
  const rangeEnd = new Date(Math.max(...ends));

  const todayPercent =
    today >= rangeStart && today <= rangeEnd ? percentBetween(today, rangeStart, rangeEnd) : null;

  const byCampaign = new Map<string, TimelineBar[]>();
  for (const p of eligible) {
    const risk = computeRisk(p.nextGateDate);
    const bar: TimelineBar = {
      productId: p.id,
      productName: p.name,
      startPercent: percentBetween(parseDate(p.briefDate!), rangeStart, rangeEnd),
      endPercent: percentBetween(parseDate(p.launchDate!), rangeStart, rangeEnd),
      gateMarkerPercent: p.nextGateDate
        ? percentBetween(parseDate(p.nextGateDate), rangeStart, rangeEnd)
        : null,
      gateMarkerDate: p.nextGateDate,
      gateStage: p.gateStage,
      isLate: risk.level === "late" || risk.level === "critical",
    };
    const key = p.campaign || "No campaign";
    const list = byCampaign.get(key) ?? [];
    list.push(bar);
    byCampaign.set(key, list);
  }

  const campaigns = [...byCampaign.entries()]
    .map(([campaign, bars]) => ({
      campaign,
      bars: bars.sort((a, b) => a.startPercent - b.startPercent),
    }))
    .sort((a, b) => a.campaign.localeCompare(b.campaign));

  return { rangeStart, rangeEnd, todayPercent, monthTicks: computeMonthTicks(rangeStart, rangeEnd), campaigns };
}
