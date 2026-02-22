import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}

/**
 * Reusable stat card component for displaying metrics and KPIs.
 * Supports icons, trend indicators, and custom styling.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Menus"
 *   value={42}
 *   icon={MenuSquare}
 *   iconClassName="text-primary"
 * />
 *
 * <StatCard
 *   title="Revenue"
 *   value="$12,345"
 *   trend={{ value: 12.5, label: "vs last month", isPositive: true }}
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("border-border/50 bg-card/80 backdrop-blur-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("flex-shrink-0", iconClassName)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
            )}
            {trend && (
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive === true && "text-green-600 dark:text-green-400",
                    trend.isPositive === false && "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground/70">{trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
