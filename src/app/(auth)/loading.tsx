export default function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
