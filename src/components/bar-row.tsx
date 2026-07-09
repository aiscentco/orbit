export function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const percent = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-3" title={`${label}: ${count}`}>
      <span className="w-28 shrink-0 truncate text-xs text-ink/60">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-petal">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-medium text-ink">{count}</span>
    </div>
  );
}
