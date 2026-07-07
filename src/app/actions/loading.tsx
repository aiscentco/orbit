import { Skeleton } from "@/components/skeleton";

export default function ActionsLoading() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-6 mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-card" />
        ))}
      </div>
    </div>
  );
}
