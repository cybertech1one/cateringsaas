import { Skeleton } from "~/components/ui/skeleton";

export default function CityExploreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-1 h-10 w-48" />
      <Skeleton className="h-5 w-64" />

      {/* Cuisine filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Restaurant cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4">
              <Skeleton className="mb-2 h-5 w-40" />
              <Skeleton className="mb-1 h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
