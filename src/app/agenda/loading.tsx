import { Skeleton } from "@/components/skeleton";

export default function AgendaLoading() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-96" />

      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <Skeleton className="h-14 w-32 rounded-lg" />
        <Skeleton className="h-14 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 self-end rounded-lg" />
      </div>
    </div>
  );
}
