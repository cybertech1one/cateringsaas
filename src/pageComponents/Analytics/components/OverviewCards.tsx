import { cn } from "~/utils/cn";
import { formatNumber } from "./utils";
import {
  Eye,
  Users,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverviewCardsProps {
  totalViews: number;
  uniqueVisitors: number;
  totalOrders: number;
  conversionRate: number;
  labels: {
    totalViews: string;
    uniqueVisitors: string;
    totalOrders: string;
    conversionRate: string;
  };
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KPICard({ icon, label, value, gradient, iconColor }: KPICardProps) {
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Cards Grid
// ---------------------------------------------------------------------------

export function OverviewCards({
  totalViews,
  uniqueVisitors,
  totalOrders,
  conversionRate,
  labels,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        icon={<Eye className="h-5 w-5" />}
        label={labels.totalViews}
        value={formatNumber(totalViews)}
        gradient="from-blue-500/15 to-blue-500/5"
        iconColor="text-blue-600"
      />
      <KPICard
        icon={<Users className="h-5 w-5" />}
        label={labels.uniqueVisitors}
        value={formatNumber(uniqueVisitors)}
        gradient="from-emerald-500/15 to-emerald-500/5"
        iconColor="text-emerald-600"
      />
      <KPICard
        icon={<ShoppingCart className="h-5 w-5" />}
        label={labels.totalOrders}
        value={formatNumber(totalOrders)}
        gradient="from-violet-500/15 to-violet-500/5"
        iconColor="text-violet-600"
      />
      <KPICard
        icon={<TrendingUp className="h-5 w-5" />}
        label={labels.conversionRate}
        value={`${conversionRate.toFixed(1)}%`}
        gradient="from-amber-500/15 to-amber-500/5"
        iconColor="text-amber-600"
      />
    </div>
  );
}
