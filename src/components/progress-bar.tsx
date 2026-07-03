export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-petal overflow-hidden">
      <div
        className="h-full rounded-full bg-brand-primary transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
