import { Skeleton } from "~/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card">
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-1" style={{ height: "200px" }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                <Skeleton
                  className="w-full max-w-[40px] rounded-t-sm"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-card lg:col-span-2">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="space-y-3 px-5 pb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          <div className="space-y-4 px-5 pb-5">
            <Skeleton className="h-4 w-full rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
