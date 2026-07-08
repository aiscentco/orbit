import { Skeleton } from "@/components/skeleton";

export default function SetupLoading() {
  return (
    <div className="max-w-2xl p-8">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-64" />

      <Skeleton className="mt-6 h-11 rounded-lg" />

      <Skeleton className="mt-8 h-6 w-48" />
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
      </div>

      <Skeleton className="mt-8 h-6 w-32" />
      <div className="mt-3 flex gap-6">
        <Skeleton className="h-9 w-9 rounded" />
        <Skeleton className="h-9 w-9 rounded" />
      </div>

      <Skeleton className="mt-8 h-6 w-32" />
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-48" />
      </div>
    </div>
  );
}
