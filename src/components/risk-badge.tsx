import type { Risk } from "@/lib/gates";

const RISK_STYLES: Record<Risk["level"], string> = {
  "on-track": "bg-status-green/10 text-status-green",
  "due-soon": "bg-status-amber/10 text-status-amber",
  late: "bg-status-red/10 text-status-red",
  critical: "bg-status-critical/10 text-status-critical",
  unknown: "bg-black/5 text-ink/50",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_STYLES[risk.level]}`}
    >
      {risk.level === "critical" && <span aria-hidden>⚑</span>}
      {risk.label}
    </span>
  );
}
