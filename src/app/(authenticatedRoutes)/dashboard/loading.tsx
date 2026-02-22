export default function DashboardPageLoading() {
  return (
    <div className="container mx-auto p-6" role="status" aria-live="polite">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}
