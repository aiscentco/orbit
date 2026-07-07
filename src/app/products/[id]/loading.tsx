import { Skeleton } from "@/components/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="p-8">
      <Skeleton className="mb-4 h-4 w-12" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-9 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      <div className="mt-6">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-6 w-24" />
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-48 rounded-card" />
        </div>
      </div>
    </div>
  );
}
