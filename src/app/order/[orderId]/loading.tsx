export default function OrderTrackingLoading() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-lg flex-col gap-6 px-4 py-12">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Status stepper skeleton */}
        <div className="space-y-4 rounded-xl border border-border/50 bg-card p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* ETA skeleton */}
        <div className="h-20 animate-pulse rounded-xl bg-muted" />

        {/* Order summary skeleton */}
        <div className="space-y-3 rounded-xl border border-border/50 bg-card p-6">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading order status...</span>
    </div>
  );
}
