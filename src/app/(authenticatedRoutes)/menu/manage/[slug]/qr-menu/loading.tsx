import { Skeleton } from "~/components/ui/skeleton";

export default function QRMenuLoading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        {/* QR Code preview */}
        <div className="rounded-xl border border-border/50 bg-card p-8">
          <Skeleton className="h-64 w-64" />
        </div>

        {/* Settings */}
        <div className="flex-1 space-y-4 rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
