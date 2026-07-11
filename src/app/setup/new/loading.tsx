import { Skeleton } from "@/components/skeleton";

export default function NewClientLoading() {
  return (
    <div className="max-w-xl p-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-80" />

      <div className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-11 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
