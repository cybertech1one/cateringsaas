import { Skeleton } from "~/components/ui/skeleton";

export default function EditMenuLoading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
        {/* Menu name */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Menu description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        {/* Logo upload */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-32 w-32 rounded-lg" />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>

        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
