"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  Star,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatPrice } from "~/utils/currency";
import { cn } from "~/utils/cn";
import { formatNumber } from "./utils";
import type { Period } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SuccessKPIsProps {
  menuId: string;
  period: Period;
}

// ---------------------------------------------------------------------------
// Day labels (0=Sunday in PostgreSQL DOW)
// ---------------------------------------------------------------------------

// Map DOW to ordered row index: Mon(1)->0, Tue(2)->1, ..., Sun(0)->6
const DOW_TO_ROW = [6, 0, 1, 2, 3, 4, 5] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  if (cents === 0) return formatPrice(0);

  const amount = cents / 100;

  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M MAD`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K MAD`;

  return formatPrice(cents);
}

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;

  return `${hour - 12}p`;
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
// Star Rating Display
// ---------------------------------------------------------------------------

function getStarColor(filled: boolean, half: boolean): string {
  if (filled) return "fill-amber-400 text-amber-400";
  if (half) return "fill-amber-400/50 text-amber-400";

  return "text-muted-foreground/30";
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;

    stars.push(
      <Star
        key={i}
        className={cn("h-4 w-4", getStarColor(filled, half))}
      />,
    );
  }

  return <div className="flex gap-0.5">{stars}</div>;
}

// ---------------------------------------------------------------------------
// Heatmap Cell
// ---------------------------------------------------------------------------

function getHeatmapColor(intensity: number): string {
  if (intensity === 0) return "bg-muted/20";
  if (intensity < 0.25) return "bg-emerald-500/20";
  if (intensity < 0.5) return "bg-emerald-500/40";
  if (intensity < 0.75) return "bg-emerald-500/60";

  return "bg-emerald-500/90";
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function KPISkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border/50 bg-muted/30" />
        ))}
      </div>
      <div className="h-48 rounded-2xl border border-border/50 bg-muted/30" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SuccessKPIs({ menuId, period }: SuccessKPIsProps) {
  const { t: _t } = useTranslation();
  const t = _t as (key: string, opts?: Record<string, unknown>) => string;

  const { data, isLoading } = api.analytics.getSuccessKPIs.useQuery(
    { menuId, period },
    { enabled: !!menuId },
  );

  // Build heatmap grid: 7 rows (Mon-Sun) x 24 columns (hours)
  const heatmapGrid = useMemo(() => {
    if (!data?.peakHoursHeatmap || data.peakHoursHeatmap.length === 0) {
      return null;
    }

    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    let maxCount = 0;

    for (const cell of data.peakHoursHeatmap) {
      const rowIdx = DOW_TO_ROW[cell.day] ?? 6;

      grid[rowIdx]![cell.hour] = cell.count;

      if (cell.count > maxCount) {
        maxCount = cell.count;
      }
    }

    return { grid, maxCount };
  }, [data?.peakHoursHeatmap]);

  if (isLoading) {
    return <KPISkeleton />;
  }

  if (!data) {
    return null;
  }

  const trendPrefix = data.revenue.trendPercent > 0 ? "+" : "";
  const trendColor = data.revenue.trendPercent >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  // Ordered day keys for display (Mon first)
  const orderedDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-display text-lg font-semibold">{t("analytics.kpi.title")}</h3>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <KPICard
          icon={<DollarSign className="h-5 w-5" />}
          label={t("analytics.kpi.revenueToday")}
          value={formatCurrency(data.revenue.today)}
          subtext={
            data.revenue.trendPercent !== 0
              ? `${trendPrefix}${data.revenue.trendPercent}% ${t("analytics.kpi.trend")}`
              : undefined
          }
          subtextColor={trendColor}
          gradient="from-emerald-500/15 to-emerald-500/5"
          iconColor="text-emerald-600"
        />

        {/* Avg Order Value */}
        <KPICard
          icon={
            data.revenue.trendPercent >= 0
              ? <TrendingUp className="h-5 w-5" />
              : <TrendingDown className="h-5 w-5" />
          }
          label={t("analytics.kpi.avgOrderValue")}
          value={data.avgOrderValue > 0 ? formatCurrency(data.avgOrderValue) : t("analytics.kpi.noOrders")}
          gradient="from-blue-500/15 to-blue-500/5"
          iconColor="text-blue-600"
        />

        {/* Customer Satisfaction */}
        <div className={cn("hover-lift group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br p-4", "from-amber-500/15 to-amber-500/5")}>
          <div className="flex items-start justify-between">
            <div className="text-amber-600"><Star className="h-5 w-5" /></div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {data.avgRating > 0 ? data.avgRating.toFixed(1) : "--"}
              </p>
              <span className="text-sm text-muted-foreground">/5</span>
            </div>
            <StarRating rating={data.avgRating} />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("analytics.kpi.customerSatisfaction")}
              {" \u2022 "}
              {t("analytics.kpi.reviews", { count: data.totalReviews })}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <KPICard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t("analytics.kpi.completionRate")}
          value={`${data.completionRate.toFixed(1)}%`}
          gradient="from-violet-500/15 to-violet-500/5"
          iconColor="text-violet-600"
        />
      </div>

      {/* Repeat Customers Badge */}
      {data.repeatCustomerRate > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {t("analytics.kpi.repeatCustomers")}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.repeatCustomerRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Revenue Summary (Week + Month) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("analytics.kpi.revenueWeek")}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatCurrency(data.revenue.week)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("analytics.kpi.revenueMonth")}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatCurrency(data.revenue.month)}
          </p>
        </div>
      </div>

      {/* Peak Hours Heatmap */}
      {heatmapGrid && heatmapGrid.maxCount > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold">{t("analytics.kpi.peakHours")}</h3>
            </div>
          </div>
          <div className="overflow-x-auto px-5 pb-5">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="mb-1 flex">
                <div className="w-10 flex-shrink-0" />
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-[10px] text-muted-foreground"
                  >
                    {i % 3 === 0 ? formatHour(i) : ""}
                  </div>
                ))}
              </div>
              {/* Rows (Mon-Sun) */}
              {orderedDayKeys.map((dayKey, rowIdx) => (
                <div key={dayKey} className="flex items-center gap-0">
                  <div className="w-10 flex-shrink-0 text-right text-[10px] font-medium text-muted-foreground pr-2">
                    {t(`analytics.kpi.${dayKey}`)}
                  </div>
                  {heatmapGrid.grid[rowIdx]!.map((count, hourIdx) => {
                    const intensity = heatmapGrid.maxCount > 0
                      ? count / heatmapGrid.maxCount
                      : 0;

                    return (
                      <div
                        key={hourIdx}
                        className={cn(
                          "m-px aspect-square flex-1 rounded-sm transition-colors",
                          getHeatmapColor(intensity),
                        )}
                        title={`${t(`analytics.kpi.${dayKey}`)} ${formatHour(hourIdx)}: ${formatNumber(count)} orders`}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                <span>Less</span>
                <div className="h-3 w-3 rounded-sm bg-muted/20" />
                <div className="h-3 w-3 rounded-sm bg-emerald-500/20" />
                <div className="h-3 w-3 rounded-sm bg-emerald-500/40" />
                <div className="h-3 w-3 rounded-sm bg-emerald-500/60" />
                <div className="h-3 w-3 rounded-sm bg-emerald-500/90" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
