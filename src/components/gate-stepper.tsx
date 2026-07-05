import { GATE_STAGES, type GateStage } from "@/lib/notion";

export function GateStepper({
  currentStage,
  onSelect,
  disabled,
}: {
  currentStage: GateStage | null;
  onSelect: (stage: GateStage) => void;
  disabled?: boolean;
}) {
  const currentIndex = currentStage ? GATE_STAGES.indexOf(currentStage) : -1;

  return (
    <div className="flex flex-wrap gap-2">
      {GATE_STAGES.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;
        return (
          <button
            key={stage}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(stage)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isCurrent
                ? "bg-brand-primary text-white"
                : isPast
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "bg-petal text-ink/50 hover:bg-brand-accent/15"
            }`}
          >
            {stage}
          </button>
        );
      })}
    </div>
  );
}
