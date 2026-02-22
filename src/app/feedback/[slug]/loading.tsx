export default function FeedbackLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-white p-8">
        {/* Logo + name skeleton */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        </div>

        {/* Title skeleton */}
        <div className="mt-4 flex justify-center">
          <div className="h-6 w-52 animate-pulse rounded bg-muted" />
        </div>

        {/* Star rating skeleton */}
        <div className="mt-6 space-y-2">
          <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 w-12 animate-pulse rounded-full bg-muted"
              />
            ))}
          </div>
        </div>

        {/* Comment field skeleton */}
        <div className="mt-6 space-y-1.5">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Name field skeleton */}
        <div className="mt-6 space-y-1.5">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Submit button skeleton */}
        <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <span className="sr-only">Loading feedback form...</span>
    </div>
  );
}
