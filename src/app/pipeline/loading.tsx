import { Skeleton } from "@/components/skeleton";

export default function PipelineLoading() {
  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <Skeleton className="mt-6 h-8 w-48 rounded-lg" />

      <div className="mt-6 flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="w-72 shrink-0 rounded-card bg-petal/40 p-3">
            <Skeleton className="mb-2 h-4 w-24" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
