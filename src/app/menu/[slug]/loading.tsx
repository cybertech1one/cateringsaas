export default function MenuLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">Loading menu...</span>
    </div>
  );
}
