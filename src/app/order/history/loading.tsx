export default function OrderHistoryLoading() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        {/* Search bar skeleton */}
        <div className="mb-8 flex gap-2">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-muted" />
          <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
        </div>

        {/* Order card skeletons */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading order history...</span>
    </div>
  );
}
