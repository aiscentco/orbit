import Link from "next/link";
import type { Product } from "@/lib/notion";
import { buildTimeline, parseDate } from "@/lib/timeline";

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function LaunchTimeline({ products }: { products: Product[] }) {
  const timeline = buildTimeline(products);

  if (!timeline) {
    return (
      <div className="rounded-card border border-black/5 p-8 text-center">
        <p className="text-sm text-ink/50">
          No products have both a Brief date and a Launch date yet — fill those in on a
          product&apos;s Details section to see it on the timeline.
        </p>
      </div>
    );
  }

  const { rangeStart, rangeEnd, todayPercent, monthTicks, campaigns } = timeline;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/50">
        <span>
          {formatDate(rangeStart)} – {formatDate(rangeEnd)}
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-primary" /> On track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-status-red" /> Late / critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rotate-45 bg-ink/60" /> Next gate date
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="w-36 shrink-0" aria-hidden />
        <div className="relative h-4 flex-1 border-b border-black/5">
          {monthTicks.map((tick) => (
            <div
              key={tick.percent}
              className="absolute top-0 h-full border-l border-black/10"
              style={{ left: `${tick.percent}%` }}
            >
              <span className="absolute top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink/40">
                {tick.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.campaign}>
            <h3 className="mb-2 text-sm font-medium text-ink">{campaign.campaign}</h3>
            <div className="flex flex-col gap-2">
              {campaign.bars.map((bar) => (
                <div key={bar.productId} className="flex items-center gap-3">
                  <Link
                    href={`/products/${bar.productId}`}
                    className="w-36 shrink-0 truncate text-xs text-ink/70 hover:text-brand-primary"
                  >
                    {bar.productName}
                  </Link>
                  <div className="relative h-3 flex-1 rounded-full bg-petal">
                    {todayPercent !== null && (
                      <div
                        className="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink/25"
                        style={{ left: `${todayPercent}%` }}
                        aria-hidden
                      />
                    )}
                    <div
                      className={`absolute h-full rounded-full ${bar.isLate ? "bg-status-red" : "bg-brand-primary"}`}
                      style={{
                        left: `${bar.startPercent}%`,
                        width: `${Math.max(bar.endPercent - bar.startPercent, 1)}%`,
                      }}
                      title={bar.productName}
                    />
                    {bar.gateMarkerPercent !== null && (
                      <div
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-ink/70"
                        style={{ left: `calc(${bar.gateMarkerPercent}% - 5px)` }}
                        title={`${bar.gateStage ?? "Next gate"} · ${formatDate(parseDate(bar.gateMarkerDate!))}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
