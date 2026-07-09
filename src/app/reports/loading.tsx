import { Skeleton } from "@/components/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 mb-6 h-4 w-48" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-black/5 p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-full rounded-full" />
            ))}
          </div>
        </div>

        <div className="rounded-card border border-black/5 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-9 w-20" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        </div>

        <div className="rounded-card border border-black/5 p-5 lg:col-span-2">
          <Skeleton className="h-5 w-56" />
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24" />
                <div className="mt-3 flex flex-col gap-2">
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-black/5 p-5 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
