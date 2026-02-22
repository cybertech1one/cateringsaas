import { type LucideIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

/**
 * Reusable empty state component for displaying when no data is available.
 * Provides a centered, visually appealing placeholder with optional action button.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Store}
 *   title="No restaurants yet"
 *   description="Get started by creating your first restaurant."
 *   action={{
 *     label: "Create Restaurant",
 *     onClick: () => setCreateDialogOpen(true),
 *     icon: Plus,
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h2 className={cn("text-xl font-semibold", Icon && "mt-6")}>{title}</h2>
      {description && (
        <p className="mb-8 mt-2 max-w-md text-center text-sm font-normal leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          className="rounded-full"
          variant="default"
          onClick={action.onClick}
        >
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
