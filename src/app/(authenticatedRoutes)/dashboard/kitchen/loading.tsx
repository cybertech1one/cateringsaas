import { Skeleton } from "~/components/ui/skeleton";

export default function KitchenLoading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 rounded-xl border border-border/50 bg-card p-4">
            <Skeleton className="mb-4 h-6 w-24" />
            {Array.from({ length: 3 }).map((_card, j) => (
              <div key={j} className="mb-3 rounded-lg border border-border/30 p-3">
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
