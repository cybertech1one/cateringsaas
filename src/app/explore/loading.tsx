import { Skeleton } from "~/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Search bar */}
      <div className="mt-6">
        <Skeleton className="h-12 w-full max-w-md rounded-xl" />
      </div>

      {/* Region/City grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4">
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
