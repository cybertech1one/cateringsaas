import { Skeleton } from "~/components/ui/skeleton";

export default function DesignEditorLoading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Editor panel */}
        <div className="space-y-4">
          {/* Color pickers */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <Skeleton className="h-6 w-28" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
