export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
