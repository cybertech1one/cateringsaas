import { cn } from "~/utils/cn";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared dashboard page header with Diyafa design system tokens.
 *
 * - Uses `font-display` (Playfair Display) for the title via base CSS rules
 * - Warm ember/gold/terracotta gradient top border (`arch-card-top`)
 * - Sand-toned background with zellige geometric pattern
 * - Consistent icon accent using the Diyafa palette
 */
export function DashboardPageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-sand via-card to-sand p-5 sm:p-6 arch-card-top",
        className,
      )}
    >
      {/* Subtle zellige geo overlay */}
      <div className="moroccan-geo absolute inset-0 pointer-events-none opacity-40" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
