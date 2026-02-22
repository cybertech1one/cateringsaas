import { cn } from "~/utils/cn";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueOverviewCardsProps {
  totalRevenue: number;
  avgOrderValue: number;
  orderCount: number;
  revenueChange: number;
  labels: {
    totalRevenue: string;
    avgOrderValue: string;
    orderCount: string;
    revenueChange: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  const amount = cents / 100;

  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M MAD`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K MAD`;

  return `${amount.toFixed(2)} MAD`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  subtextColor?: string;
  gradient: string;
  iconColor: string;
}

function KPICard({ icon, label, value, subtext, subtextColor, gradient, iconColor }: KPICardProps) {
  return (
    <div className={cn("hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br p-4", gradient)}>
      <div className="flex items-start justify-between">
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {subtext && (
          <p className={cn("mt-1 text-xs font-medium", subtextColor)}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Overview Cards Grid
// ---------------------------------------------------------------------------

export function RevenueOverviewCards({
  totalRevenue,
  avgOrderValue,
  orderCount,
  revenueChange,
  labels,
}: RevenueOverviewCardsProps) {
  const changePrefix = revenueChange > 0 ? "+" : "";
  const changeColor = revenueChange >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        icon={<DollarSign className="h-5 w-5" />}
        label={labels.totalRevenue}
        value={formatCurrency(totalRevenue)}
        subtext={revenueChange !== 0 ? `${changePrefix}${revenueChange}% ${labels.revenueChange}` : undefined}
        subtextColor={changeColor}
        gradient="from-emerald-500/15 to-emerald-500/5"
        iconColor="text-emerald-600"
      />
      <KPICard
        icon={
          revenueChange >= 0
            ? <TrendingUp className="h-5 w-5" />
            : <TrendingDown className="h-5 w-5" />
        }
        label={labels.avgOrderValue}
        value={formatCurrency(avgOrderValue)}
        gradient="from-blue-500/15 to-blue-500/5"
        iconColor="text-blue-600"
      />
      <KPICard
        icon={<ShoppingCart className="h-5 w-5" />}
        label={labels.orderCount}
        value={formatNumber(orderCount)}
        gradient="from-violet-500/15 to-violet-500/5"
        iconColor="text-violet-600"
      />
    </div>
  );
}
