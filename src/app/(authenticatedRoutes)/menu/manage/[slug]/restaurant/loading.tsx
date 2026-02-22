import { Skeleton } from "~/components/ui/skeleton";

export default function RestaurantSettingsLoading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form sections */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_field, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
  );
}
