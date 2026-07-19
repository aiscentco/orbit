export function BarRow({
  label,
  count,
  max,
  color,
  displayValue,
  suffix,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
  displayValue?: string;
  suffix?: { text: string; color: string };
}) {
  const percent = max === 0 ? 0 : Math.round((count / max) * 100);
  const shown = displayValue ?? String(count);
  return (
    <div className="flex items-center gap-3" title={`${label}: ${shown}${suffix ? ` ${suffix.text}` : ""}`}>
      <span className="w-28 shrink-0 truncate text-xs text-ink/60">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-petal">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="shrink-0 whitespace-nowrap text-right text-xs font-medium text-ink">
        {shown}
        {suffix && (
          <span className="ml-1 font-semibold" style={{ color: suffix.color }}>
            {suffix.text}
          </span>
        )}
      </span>
    </div>
  );
}
